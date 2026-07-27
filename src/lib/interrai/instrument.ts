/**
 * interRAI Instrument Access Layer
 *
 * Provides read-only access to the interRAI HC Schweiz seed instrument. No UI
 * code should know the internal structure of the seed — all access goes through
 * this module.
 *
 * Key capabilities:
 * - Lookup bereiche, items, and sub-items by code
 * - Composite classification into display cases
 * - Shared-options resolution (sub-items inherit parent options)
 * - Input field enumeration (for progress / completeness tracking)
 * - Skip-logic evaluation from item dependencies
 * - Matrix legend vs. direct display mode
 */

import {
  interraiHcSchweiz,
  type Instrument,
  type Bereich,
  type Item,
  type SubItem,
  type AnswerOption,
  type AnswerColumn,
  type Attachment,
  type Dependency,
  type AnswerType,
} from "./seed/interrai-hc-seed";

// ── Re-export seed and all its types for direct consumer access ───────────────

export {
  interraiHcSchweiz,
  type Instrument,
  type Bereich,
  type Item,
  type SubItem,
  type AnswerOption,
  type AnswerColumn,
  type Attachment,
  type Dependency,
  type AnswerType,
};

// ── Lookup caches (built once at module load) ─────────────────────────────────

const bereicheByCode = new Map<string, Bereich>();
const itemsByCode = new Map<string, Item>();
const subItemsByCode = new Map<string, { subItem: SubItem; parentItem: Item; bereichCode: string }>();

for (const b of interraiHcSchweiz.bereiche) {
  bereicheByCode.set(b.code, b);
  for (const item of b.items) {
    itemsByCode.set(item.code, item);
    if (item.subItems) {
      for (const sub of item.subItems) {
        subItemsByCode.set(sub.code, { subItem: sub, parentItem: item, bereichCode: b.code });
      }
    }
  }
}

// ── Bereich / Item / SubItem getters ─────────────────────────────────────────

export function getBereich(code: string): Bereich | undefined {
  return bereicheByCode.get(code);
}

export function getItem(code: string): Item | undefined {
  return itemsByCode.get(code);
}

export function getSubItem(
  code: string,
): { subItem: SubItem; parentItem: Item; bereichCode: string } | undefined {
  return subItemsByCode.get(code);
}

export function getAllBereiche(): Bereich[] {
  return interraiHcSchweiz.bereiche;
}

// ── Shared-options resolution ─────────────────────────────────────────────────

const CHOICE_TYPES = new Set<AnswerType>(["single_choice"]);

function isChoiceType(answerType: AnswerType): boolean {
  return CHOICE_TYPES.has(answerType);
}

/**
 * Returns the effective answer options for any answerable code (item code or
 * sub-item code).
 *
 * A sub-item inherits parent options ONLY when:
 *   (a) it has no own options, AND
 *   (b) its answerType is "single_choice".
 * Sub-items with text / number / date / composite type NEVER inherit options.
 */
export function getEffectiveOptions(code: string): AnswerOption[] {
  const subEntry = subItemsByCode.get(code);
  if (subEntry) {
    const { subItem, parentItem } = subEntry;
    if (subItem.options && subItem.options.length > 0) {
      return subItem.options;
    }
    if (isChoiceType(subItem.answerType)) {
      return parentItem.options ?? [];
    }
    return [];
  }

  const item = itemsByCode.get(code);
  return item?.options ?? [];
}

// ── Composite type classification ─────────────────────────────────────────────

/**
 * Display cases for composite items.
 *
 * - simple:         item has no sub-items (single answerable field at item level)
 * - matrix:         all sub-items are single_choice and inherit parent options;
 *                   no columns
 * - matrix_columns: item has `columns` array (G1 layout — one answer per column
 *                   per sub-item)
 * - stacked:        every sub-item carries its own options
 * - fieldgroup:     zero choice sub-items (all text / number / date)
 * - mixed_n2:       item code is "N2" — matrix with attachments on some
 *                   sub-items
 * - repeat_fixed:   item has `repeatRows` (I3 — fixed repeatable block)
 * - repeat_dynamic: item has `repeatable: true` (P2 — assessor-entered count)
 */
export type CompositeType =
  | "simple"
  | "matrix"
  | "matrix_columns"
  | "stacked"
  | "fieldgroup"
  | "mixed_n2"
  | "repeat_fixed"
  | "repeat_dynamic";

/**
 * Classifies an item into one of the eight display cases.
 * Throws if the item exists but does not match any case (guard against future
 * seed additions that break assumptions).
 */
export function getCompositeType(code: string): CompositeType {
  const item = itemsByCode.get(code);
  if (!item) {
    throw new Error(`getCompositeType: unknown item code "${code}"`);
  }

  // No sub-items → simple
  if (!item.subItems || item.subItems.length === 0) {
    return "simple";
  }

  // Dynamic-count repeatable block (P2)
  if (item.repeatable === true) {
    return "repeat_dynamic";
  }

  // Fixed-count repeatable block (I3)
  if (typeof item.repeatRows === "number") {
    return "repeat_fixed";
  }

  // Two-column matrix (G1)
  if (item.columns && item.columns.length > 0) {
    return "matrix_columns";
  }

  // N2 — matrix with per-sub-item numeric attachments
  if (item.code === "N2") {
    return "mixed_n2";
  }

  const choiceSubs = item.subItems.filter((s) => isChoiceType(s.answerType));
  const nonChoiceSubs = item.subItems.filter((s) => !isChoiceType(s.answerType));

  // No choice sub-items → fieldgroup
  if (choiceSubs.length === 0) {
    return "fieldgroup";
  }

  // All sub-items are choice type — check inheritance vs. own options
  if (nonChoiceSubs.length === 0) {
    const allInherit = choiceSubs.every((s) => !s.options || s.options.length === 0);
    if (allInherit && item.options && item.options.length > 0) {
      return "matrix";
    }

    const allOwn = choiceSubs.every((s) => s.options && s.options.length > 0);
    if (allOwn) {
      return "stacked";
    }
  }

  // Fallthrough — item has sub-items but none of the known patterns match
  throw new Error(
    `getCompositeType: item "${code}" has sub-items but does not match any known display case. ` +
      `Check the seed and extend CompositeType if a new layout pattern was introduced.`,
  );
}

// ── Matrix legend vs. direct display mode ────────────────────────────────────

export type MatrixDisplayMode = "legend" | "direct";

/**
 * Determines whether a matrix item needs a separate legend or can print option
 * text directly on the selection surfaces.
 *
 * Rule: ≤4 options AND longest option label ≤15 characters → "direct".
 * Both conditions must hold; otherwise → "legend".
 */
export function getMatrixDisplayMode(code: string): MatrixDisplayMode {
  const item = itemsByCode.get(code);
  if (!item || !item.options || item.options.length === 0) return "legend";
  if (item.options.length > 4) return "legend";
  const maxLen = Math.max(...item.options.map((o) => o.label.length));
  if (maxLen > 15) return "legend";
  return "direct";
}

/**
 * Returns matrix layout metadata for an item.
 * Returns null if the item is not a matrix type or does not exist.
 */
export function getMatrixInfo(code: string): {
  code: string;
  optionCount: number;
  maxLabelLength: number;
  mode: MatrixDisplayMode;
} | null {
  const item = itemsByCode.get(code);
  if (!item) return null;

  let compositeType: CompositeType;
  try {
    compositeType = getCompositeType(code);
  } catch {
    return null;
  }

  if (compositeType !== "matrix" && compositeType !== "matrix_columns" && compositeType !== "mixed_n2") {
    return null;
  }

  const opts = item.options ?? [];
  const maxLen = opts.length > 0 ? Math.max(...opts.map((o) => o.label.length)) : 0;
  return {
    code,
    optionCount: opts.length,
    maxLabelLength: maxLen,
    mode: getMatrixDisplayMode(code),
  };
}

// ── Input field enumeration ───────────────────────────────────────────────────

export interface InputField {
  /** The answerable code used as the form field key */
  code: string;
  /** Display label for the field */
  label: string;
  /** The bereich this field belongs to */
  bereichCode: string;
  /** The parent item code (equals `code` for top-level simple items) */
  parentItemCode: string;
}

/**
 * Enumerates all answerable input fields for a given bereich.
 *
 * Enumeration rules:
 * - Simple item (no sub-items): 1 field, code = item.code
 * - Sub-item without columns:   1 field, code = sub.code
 * - Sub-item WITH columns:      N fields, code = sub.code + column.code.toLowerCase()
 *   (e.g. G1a with columns A, B → "G1aa", "G1ab")
 * - Attachment field:           1 field, code = attachment.code
 *
 * Composite parent items themselves are NOT enumerated as fields; only their
 * children (sub-items / attachments) are.
 */
export function getInputFieldsForBereich(bereichCode: string): InputField[] {
  const b = bereicheByCode.get(bereichCode);
  if (!b) return [];

  const fields: InputField[] = [];

  for (const item of b.items) {
    if (!item.subItems || item.subItems.length === 0) {
      // Simple item — item itself is the single input field
      fields.push({
        code: item.code,
        label: item.label,
        bereichCode: b.code,
        parentItemCode: item.code,
      });
      continue;
    }

    for (const sub of item.subItems) {
      if (item.columns && item.columns.length > 0) {
        // G1-style: one field per column per sub-item
        for (const col of item.columns) {
          fields.push({
            code: sub.code + col.code.toLowerCase(),
            label: `${sub.label} (${col.label})`,
            bereichCode: b.code,
            parentItemCode: item.code,
          });
        }
      } else {
        // Regular sub-item
        fields.push({
          code: sub.code,
          label: sub.label,
          bereichCode: b.code,
          parentItemCode: item.code,
        });
      }

      // Attachment fields (N2 e, f, g pattern)
      if (sub.attachments) {
        for (const att of sub.attachments) {
          fields.push({
            code: att.code,
            label: att.label,
            bereichCode: b.code,
            parentItemCode: item.code,
          });
        }
      }
    }
  }

  return fields;
}

/**
 * Returns all input fields across the entire instrument.
 */
export function getAllInputFields(): InputField[] {
  return interraiHcSchweiz.bereiche.flatMap((b) => getInputFieldsForBereich(b.code));
}

/**
 * Returns per-bereich field counts and the instrument total.
 */
export function getInputFieldStats(): {
  perBereich: { code: string; title: string; count: number }[];
  total: number;
} {
  const perBereich = interraiHcSchweiz.bereiche.map((b) => ({
    code: b.code,
    title: b.title,
    count: getInputFieldsForBereich(b.code).length,
  }));
  return {
    perBereich,
    total: perBereich.reduce((sum, b) => sum + b.count, 0),
  };
}

// ── Skip-logic evaluation ─────────────────────────────────────────────────────

export interface SkipResult {
  /** Item and sub-item codes that should be hidden / skipped */
  skippedItemCodes: Set<string>;
  /** Bereich codes that should be skipped entirely */
  skippedBereichCodes: Set<string>;
}

/**
 * Evaluates skip logic for the entire instrument given the current answer map.
 *
 * Each item's `dependencies` array describes trigger conditions. When an
 * answer matches a trigger value the referenced target codes / bereiche are
 * added to the skip sets.
 *
 * Target syntax supported:
 * - "C2,C3"         → comma-separated list of individual item codes to skip
 * - "D"             → single uppercase letter → skip entire bereich
 * - "I2a-I2u"       → range across sub-items (both endpoints inclusive)
 * - "A(rest)"       → skip all items after the triggering item inside bereich A
 */
export function evaluateSkipLogic(answers: Record<string, string | null>): SkipResult {
  const skippedItemCodes = new Set<string>();
  const skippedBereichCodes = new Set<string>();

  for (const b of interraiHcSchweiz.bereiche) {
    for (const item of b.items) {
      if (!item.dependencies) continue;

      const answerValue = answers[item.code];
      if (answerValue === null || answerValue === undefined) continue;

      for (const dep of item.dependencies) {
        if (dep.action !== "skip_items") continue;
        if (answerValue !== dep.triggerValue) continue;

        const targets = dep.target.split(",").map((t) => t.trim());

        for (const target of targets) {
          if (target.includes("(rest)")) {
            // Skip all items that follow the current item in the given (or current) bereich
            const bereichCode = target.replace("(rest)", "").trim() || b.code;
            const targetBereich = bereicheByCode.get(bereichCode) ?? b;
            let foundCurrent = false;
            for (const bi of targetBereich.items) {
              if (bi.code === item.code) {
                foundCurrent = true;
                continue;
              }
              if (foundCurrent) {
                skippedItemCodes.add(bi.code);
                if (bi.subItems) bi.subItems.forEach((s) => skippedItemCodes.add(s.code));
              }
            }
          } else if (/^[A-Z]$/.test(target)) {
            // Single uppercase letter → skip entire bereich
            skippedBereichCodes.add(target);
            const targetBereich = bereicheByCode.get(target);
            if (targetBereich) {
              for (const bi of targetBereich.items) {
                skippedItemCodes.add(bi.code);
                if (bi.subItems) bi.subItems.forEach((s) => skippedItemCodes.add(s.code));
              }
            }
          } else if (target.includes("-")) {
            // Range like "I2a-I2u"
            const [startCode, endCode] = target.split("-").map((t) => t.trim());
            let inRange = false;
            outerRange: for (const bi of b.items) {
              if (bi.subItems) {
                for (const sub of bi.subItems) {
                  if (sub.code === startCode) inRange = true;
                  if (inRange) skippedItemCodes.add(sub.code);
                  if (sub.code === endCode) { inRange = false; break outerRange; }
                }
              }
              if (bi.code === startCode) inRange = true;
              if (inRange) {
                skippedItemCodes.add(bi.code);
                if (bi.subItems) bi.subItems.forEach((s) => skippedItemCodes.add(s.code));
              }
              if (bi.code === endCode) break;
            }
          } else {
            // Individual item or sub-item code
            skippedItemCodes.add(target);
            // Also skip any sub-items of a matched parent item
            const targetItem = itemsByCode.get(target);
            if (targetItem?.subItems) {
              targetItem.subItems.forEach((s) => skippedItemCodes.add(s.code));
            }
          }
        }
      }
    }
  }

  return { skippedItemCodes, skippedBereichCodes };
}

/**
 * Returns active / skipped / total input field counts for progress calculation.
 */
export function getActiveInputFieldCount(answers: Record<string, string | null>): {
  total: number;
  skipped: number;
  active: number;
} {
  const allFields = getAllInputFields();
  const { skippedItemCodes } = evaluateSkipLogic(answers);
  const skipped = allFields.filter((f) => skippedItemCodes.has(f.code)).length;
  return {
    total: allFields.length,
    skipped,
    active: allFields.length - skipped,
  };
}
