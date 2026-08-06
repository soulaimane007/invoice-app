<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Services\NumberToFrenchWordsConverter;
use DOMDocument;
use DOMElement;
use DOMXPath;

class TemplateRendererService
{
    public function __construct(private readonly NumberToFrenchWordsConverter $numberConverter)
    {
    }
    /**
     * Every key here MUST match a key in the frontend's
     * src/utils/templateVariables.js catalog exactly — mismatched keys
     * silently render as empty text rather than erroring, so keep the
     * two lists side by side whenever either changes.
     */
    public function render(string $templateHtml, $document, string $documentType): string
    {
        $company = CompanySetting::current();

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        // The xml-encoding prefix trick is required — without it,
        // DOMDocument silently mis-reads UTF-8 as Latin-1 and mangles
        // every accented French character in the template.
        $dom->loadHTML('<?xml encoding="utf-8" ?>'.$templateHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $conditionValues = $this->buildConditionValues($document, $documentType);

        $this->expandLineItemsRow($dom, $xpath, $document, $conditionValues);
        $this->substituteRemainingVariables($dom, $xpath, $document, $company, $documentType);
        // Matches both the paragraph-level (<div>) and single-variable
        // (<span>) conditional wrappers with one query.
        $this->stripConditionalBlocks($xpath, $xpath->query('//*[@data-condition-var]'), $conditionValues);
        $this->applyTableCellPadding($xpath);
        $this->applyTableBorderWidth($xpath);
        $this->applyHiddenCellBorders($xpath);
        $this->convertColumnWidthsToPercentages($xpath);

        return $dom->saveHTML() ?: '';
    }

 private function expandLineItemsRow(DOMDocument $dom, DOMXPath $xpath, $document, array $documentConditionValues): void
    {
        $rows = $xpath->query('//tr[.//span[starts-with(@data-variable, "line_")]]');

        if (! $rows || $rows->length === 0) {
            return; // template has no line-items table — nothing to expand
        }

        $templateRow = $rows->item(0);
        $parent = $templateRow->parentNode;
        if (! $parent) {
            return;
        }

        $lines = $document->lignes;
        $lineCount = count($lines);

        if ($lineCount === 0) {
            $parent->removeChild($templateRow);

            return;
        }

        $table = $this->findAncestorTable($templateRow);
        if ($table && $table->getAttribute('data-stack-lines') === 'true') {
            $this->stackLineItemsInPlace($xpath, $templateRow, $lines, $documentConditionValues);

            return;
        }

        $seamlessPositions = [];
        $position = 0;
        foreach (iterator_to_array($templateRow->childNodes) as $cell) {
            if ($cell->nodeType !== XML_ELEMENT_NODE) {
                continue;
            }
            if ($cell->getAttribute('data-span-all-lines') === 'true') {
                $seamlessPositions[] = $position;
            }
            $position++;
        }

        $index = 0;
        foreach ($lines as $line) {
            $newRow = $dom->createElement($templateRow->nodeName);
            foreach ($templateRow->attributes ?? [] as $attr) {
                $newRow->setAttribute($attr->name, $attr->value);
            }

            $cellIndex = 0;
            foreach (iterator_to_array($templateRow->childNodes) as $cell) {
                if ($cell->nodeType !== XML_ELEMENT_NODE) {
                    continue;
                }

                $clone = $cell->cloneNode(true);
                $this->substituteLineVariables($xpath, $clone, $line);

                $lineConditionValues = array_merge($documentConditionValues, $this->buildLineConditionValues($line));
                $this->stripConditionalBlocks($xpath, $xpath->query('.//*[@data-condition-var]', $clone), $lineConditionValues);

                if (in_array($cellIndex, $seamlessPositions, true)) {
                    $overrides = [];
                    if ($index > 0) {
                        $overrides[] = 'border-top: none !important';
                    }
                    if ($index < $lineCount - 1) {
                        $overrides[] = 'border-bottom: none !important';
                    }
                    if ($overrides) {
                        $existing = trim($clone->getAttribute('style'), '; ');
                        $clone->setAttribute('style', $existing ? $existing.'; '.implode('; ', $overrides) : implode('; ', $overrides));
                    }
                }

                $newRow->appendChild($clone);
                $cellIndex++;
            }

            $parent->insertBefore($newRow, $templateRow);
            $index++;
        }

        $parent->removeChild($templateRow);
    }

    private function findAncestorTable(?\DOMNode $node): ?\DOMElement
    {
        while ($node && $node->nodeName !== 'table') {
            $node = $node->parentNode;
        }

        return $node instanceof \DOMElement ? $node : null;
    }

    /**
     * Verified against a 3-line stack (three products in one column,
     * three matching totals in another) before this was written in — all
     * data present, joined with <br>, exactly one <tr> in the output,
     * never creating new rows.
     */
    private function stackLineItemsInPlace(DOMXPath $xpath, \DOMElement $templateRow, $lines, array $documentConditionValues): void
    {
        $dom = $templateRow->ownerDocument;

        foreach (iterator_to_array($templateRow->childNodes) as $cell) {
            if ($cell->nodeType !== XML_ELEMENT_NODE) {
                continue;
            }
            $hasLineVar = $xpath->query('.//span[starts-with(@data-variable, "line_")]', $cell)->length > 0;
            if (! $hasLineVar) {
                continue; // static cell — shown once, left untouched
            }

            $stackedNodes = [];
            $cellTextAlign = null;
            $isFirst = true;
            foreach ($lines as $line) {
                $cellClone = $cell->cloneNode(true);
                $this->substituteLineVariables($xpath, $cellClone, $line);

                $lineConditionValues = array_merge($documentConditionValues, $this->buildLineConditionValues($line));
                $this->stripConditionalBlocks($xpath, $xpath->query('.//*[@data-condition-var]', $cellClone), $lineConditionValues);

                if (! $isFirst) {
                    $stackedNodes[] = $dom->createElement('br');
                }
                $isFirst = false;

                // Unwrap <p> wrappers — take the paragraph's OWN children
                // rather than the <p> itself, to avoid the paragraph's own
                // margin/min-height stacking on top of the <br> above. But
                // capture its text-align first (from whichever line's <p>
                // has it first — they're all the same, since alignment was
                // set once on the single template row before expansion)
                // and apply it to the whole cell, so alignment survives
                // and stays consistent across every stacked line.
                foreach (iterator_to_array($cellClone->childNodes) as $inner) {
                    if ($inner->nodeType === XML_ELEMENT_NODE && $inner->nodeName === 'p') {
                        if ($cellTextAlign === null && preg_match('/text-align:\s*([a-z]+)/', $inner->getAttribute('style'), $m)) {
                            $cellTextAlign = $m[1];
                        }
                        foreach (iterator_to_array($inner->childNodes) as $grandchild) {
                            $stackedNodes[] = $grandchild;
                        }
                    } else {
                        $stackedNodes[] = $inner;
                    }
                }
            }

            while ($cell->firstChild) {
                $cell->removeChild($cell->firstChild);
            }
            foreach ($stackedNodes as $node) {
                $cell->appendChild($node);
            }

            if ($cellTextAlign !== null) {
                $existing = trim($cell->getAttribute('style'), '; ');
                $cell->setAttribute('style', $existing ? $existing.'; text-align:'.$cellTextAlign : 'text-align:'.$cellTextAlign);
            }
        }
    }

    private function substituteLineVariables(DOMXPath $xpath, $node, $line): void
    {
        $spans = $xpath->query('.//span[@data-variable]', $node);
        foreach (iterator_to_array($spans) as $span) {
            $key = $span->getAttribute('data-variable');
            $value = $this->resolveLineValue($key, $line);

            if ($span->getAttribute('data-spell-out') === 'true') {
                $numeric = $this->resolveLineNumericValue($key, $line);
                if ($numeric !== null) {
                    $value = $this->isCurrencyKey($key)
                        ? $this->numberConverter->convertCurrency($numeric, 'dirhams', 'centimes')
                        : $this->numberConverter->convert((int) round($numeric));
                }
                // $numeric === null (a non-numeric variable) — leave $value
                // as the normal resolved text, spell-out silently no-ops.
            }

            $this->replaceSpan($span, $value);
        }
    }

    private function resolveLineNumericValue(string $key, $line): ?float
    {
        return match ($key) {
            'line_quantity' => (float) $line->quantity,
            'line_unit_price' => (float) $line->unit_price,
            'line_tva_rate' => (float) $line->tva_rate,
            'line_total_ht' => (float) $line->total_ht,
            'line_unit_price_ttc' => (float) $line->unit_price * (1 + (float) $line->tva_rate / 100),
            'line_total_ttc' => (float) $line->total_ttc,
            default => null,
        };
    }

    private function resolveLineValue(string $key, $line): string
    {
        return match ($key) {
            'line_description' => (string) $line->description,
            'line_quantity' => $line->quantity === null ? '' : rtrim(rtrim(number_format((float) $line->quantity, 2, ',', ' '), '0'), ','),
            'line_unit' => (string) $line->unit,
            'line_unit_price' => number_format((float) $line->unit_price, 2, ',', ' '),
            'line_tva_rate' => number_format((float) $line->tva_rate, 1).'%',
            'line_total_ht' => number_format((float) $line->total_ht, 2, ',', ' '),
            'line_unit_price_ttc' => number_format((float) $line->unit_price * (1 + (float) $line->tva_rate / 100), 2, ',', ' '),
            'line_total_ttc' => number_format((float) $line->total_ttc, 2, ',', ' '),
            'line_matricules' => isset($line->matricules)
                ? $line->matricules->pluck('matricule')->implode(', ')
                : '', // devis lines never have matricules — always empty there, by design
            default => '',
        };
    }

    private function substituteRemainingVariables(DOMDocument $dom, DOMXPath $xpath, $document, CompanySetting $company, string $documentType): void
    {
        $values = $this->buildScalarValues($document, $company, $documentType);

      $spans = $xpath->query('//span[@data-variable]');
        foreach (iterator_to_array($spans) as $span) {
            $key = $span->getAttribute('data-variable');
            $value = (string) ($values[$key] ?? '');

            if ($span->getAttribute('data-spell-out') === 'true') {
                $numeric = $this->resolveNumericValue($key, $document, $documentType);
                if ($numeric !== null) {
                    [$currencyLabel, $centimeLabel] = $this->currencyWords($document->currency ?? 'MAD');
                    $value = $this->isCurrencyKey($key)
                        ? $this->numberConverter->convertCurrency($numeric, $currencyLabel, $centimeLabel)
                        : $this->numberConverter->convert((int) round($numeric));
                }
            }

            $this->replaceSpan($span, $value);
        }
        $images = $xpath->query('//img[@data-variable-image]');
        foreach (iterator_to_array($images) as $img) {
            if ($img->getAttribute('data-variable-image') === 'company_logo' && $company->logo_full_path) {
                $img->setAttribute('src', $company->logo_full_path);
            } else {
                // No logo uploaded — remove the placeholder rather than
                // let a broken-image icon show up in the PDF.
                $img->parentNode?->removeChild($img);
            }
        }
    }

    private function resolveNumericValue(string $key, $document, string $documentType): ?float
    {
        $value = match ($key) {
            'subtotal' => (float) $document->subtotal,
            'tax_total' => (float) $document->tax_total,
            'total' => (float) $document->total,
            default => null,
        };
        if ($value !== null) {
            return $value;
        }

        if ($documentType === 'facture') {
            return match ($key) {
                'amount_paid' => (float) $document->amount_paid,
                'remaining_balance' => (float) $document->remaining_balance,
                default => null,
            };
        }

        return null;
    }

    private function isCurrencyKey(string $key): bool
    {
        return in_array($key, ['subtotal', 'tax_total', 'total', 'amount_paid', 'remaining_balance', 'line_unit_price', 'line_total_ht', 'line_unit_price_ttc', 'line_total_ttc'], true);
    }

    /** @return array{0: string, 1: string} [currency word, centime word] */
    private function currencyWords(string $currency): array
    {
        return match (strtoupper($currency)) {
            'MAD' => ['dirhams', 'centimes'],
            'EUR' => ['euros', 'centimes'],
            'USD' => ['dollars', 'cents'],
            default => [$currency, 'centimes'],
        };
    }

    private function buildScalarValues($document, CompanySetting $company, string $documentType): array
    {
        $values = [
            'company_name' => (string) $company->company_name,
            'company_address' => (string) $company->address,
            'company_phone' => (string) $company->phone,
            'company_email' => (string) $company->email,
            'company_ice' => (string) $company->ice,
            'footer_note' => (string) $company->invoice_footer_note,

            'client_name' => (string) $document->client_name,
            'client_address' => (string) $document->client_address,
            'client_phone' => (string) $document->client_phone,
            'client_email' => (string) $document->client_email,
            'client_ice' => (string) $document->client_ice,

            'sous_client_name' => (string) ($document->sous_client_name ?? ''),
            'sous_client_reference' => (string) ($document->sous_client_reference ?? ''),

            'reference' => (string) $document->reference,
            'date' => $document->date?->format('d/m/Y') ?? '',
            'comment' => (string) ($document->comment ?? ''),

            'subtotal' => number_format((float) $document->subtotal, 2, ',', ' '),
            'tax_total' => number_format((float) $document->tax_total, 2, ',', ' '),
            'total' => number_format((float) $document->total, 2, ',', ' '),
        ];

        if ($documentType === 'devis') {
            $labels = ['draft' => 'Brouillon', 'sent' => 'Envoyé', 'accepted' => 'Accepté', 'rejected' => 'Refusé'];
            $values['status'] = $labels[$document->status] ?? (string) $document->status;
        } else {
            $labels = ['unpaid' => 'Impayé', 'partial' => 'Partiel', 'paid' => 'Payé'];
            $values['due_date'] = $document->due_date?->format('d/m/Y') ?? '';
            $values['payment_status'] = $labels[$document->payment_status] ?? (string) $document->payment_status;
            $values['amount_paid'] = number_format((float) $document->amount_paid, 2, ',', ' ');
            $values['remaining_balance'] = number_format((float) $document->remaining_balance, 2, ',', ' ');
        }

        return $values;
    }

    /**
     * Absolute pixel column widths (what the editor naturally produces
     * when you resize a column) render differently in dompdf than in a
     * real browser, because they're two separate rendering engines with
     * different internal width/DPI handling — no shared stylesheet can
     * fix that gap. Percentages sidestep it: "45% of the table" behaves
     * identically everywhere, since it's relative to whatever the
     * table's actual width ends up being in each context, not a fixed
     * number either engine has to interpret. Verified against a 4-column
     * table before this was written in — proportions summed to exactly
     * 100%.
     */
    private function convertColumnWidthsToPercentages(DOMXPath $xpath): void
    {
        $colgroups = $xpath->query('//colgroup');
        foreach (iterator_to_array($colgroups) as $colgroup) {
            $cols = iterator_to_array($xpath->query('./col', $colgroup));
            $widths = [];
            $total = 0;
            $allHaveWidths = true;
            foreach ($cols as $col) {
                // Negative lookbehind: "min-width: 25px" (TipTap's
                // default for a never-manually-resized column) contains
                // the literal substring "width:" — without excluding
                // "min-" here, that default minimum was being misread
                // as a genuine, deliberately-set width.
                if (preg_match('/(?<!min-)width:\s*(\d+(?:\.\d+)?)px/', $col->getAttribute('style'), $m)) {
                    $widths[] = (float) $m[1];
                    $total += (float) $m[1];
                } else {
                    $widths[] = null;
                    $allHaveWidths = false;
                }
            }
            // Only safe to convert when EVERY column has a genuine width
            // — a partial set means one real column would claim its
            // share of an incomplete total, starving whichever column
            // has none. Leave those tables exactly as they already were.
            if (! $allHaveWidths || $total <= 0) {
                continue;
            }
            foreach ($cols as $i => $col) {
                $percentage = round(($widths[$i] / $total) * 100, 2);
                $col->setAttribute('style', "width: {$percentage}%");
            }
        }

        // Also strip any fixed pixel/mm width the <table> itself picked
        // up from the editor's on-screen size, so it fills 100% of the
        // page consistently — matching the shared stylesheet's own rule.
        $tables = $xpath->query('//table[@style]');
        foreach (iterator_to_array($tables) as $table) {
            $style = preg_replace('/(?:min-)?width:\s*\d+(?:\.\d+)?(?:px|mm)\s*;?/', '', $table->getAttribute('style'));
            $table->setAttribute('style', trim($style, '; '));
        }
    }

    private function applyTableCellPadding(DOMXPath $xpath): void
    {
        $tables = $xpath->query('//table[@data-cell-padding]');
        foreach (iterator_to_array($tables) as $table) {
            $padding = (int) $table->getAttribute('data-cell-padding');
            if ($padding < 0) {
                continue;
            }
            $cells = $xpath->query('.//td | .//th', $table);
            foreach (iterator_to_array($cells) as $cell) {
                $existing = trim($cell->getAttribute('style'), '; ');
                $override = "padding-top: {$padding}px !important; padding-bottom: {$padding}px !important";
                $cell->setAttribute('style', $existing ? $existing.'; '.$override : $override);
            }
        }
    }

    private function applyTableBorderWidth(DOMXPath $xpath): void
    {
        $tables = $xpath->query('//table[contains(concat(" ", normalize-space(@class), " "), " tpl-bordered ") and @data-border-width]');
        foreach (iterator_to_array($tables) as $table) {
            $width = (int) $table->getAttribute('data-border-width');
            if ($width < 1) {
                continue;
            }
            $cells = $xpath->query('.//td | .//th', $table);
            foreach (iterator_to_array($cells) as $cell) {
                $existing = trim($cell->getAttribute('style'), '; ');
                $override = "border-width: {$width}px !important";
                $cell->setAttribute('style', $existing ? $existing.'; '.$override : $override);
            }
        }
    }

    /**
     * Runs AFTER applyTableBorderWidth on purpose — "hidden" declarations
     * need to be last in the style string, so they unambiguously win for
     * any cell whose border was ALSO just given an explicit width above.
     */
    private function applyHiddenCellBorders(DOMXPath $xpath): void
    {
        $cells = $xpath->query('//td[@data-hidden-borders] | //th[@data-hidden-borders]');
        foreach (iterator_to_array($cells) as $cell) {
            $sides = array_filter(explode(',', $cell->getAttribute('data-hidden-borders')));
            $overrides = array_map(fn ($side) => "border-{$side}: none !important", $sides);
            if (! $overrides) {
                continue;
            }
            $existing = trim($cell->getAttribute('style'), '; ');
            $cell->setAttribute('style', $existing ? $existing.'; '.implode('; ', $overrides) : implode('; ', $overrides));
        }
    }

    private function buildConditionValues($document, string $documentType): array
    {
        $values = [
            'subtotal' => (float) $document->subtotal,
            'tax_total' => (float) $document->tax_total,
            'total' => (float) $document->total,
        ];
        if ($documentType === 'devis') {
            $values['status'] = (string) $document->status;
        } else {
            $values['payment_status'] = (string) $document->payment_status;
            $values['amount_paid'] = (float) $document->amount_paid;
            $values['remaining_balance'] = (float) $document->remaining_balance;
        }

        return $values;
    }

    private function buildLineConditionValues($line): array
    {
        return [
            'line_quantity' => (float) $line->quantity,
            'line_unit' => (string) $line->unit,
            'line_unit_price' => (float) $line->unit_price,
            'line_tva_rate' => (float) $line->tva_rate,
            'line_total_ht' => (float) $line->total_ht,
            'line_unit_price_ttc' => (float) $line->unit_price * (1 + (float) $line->tva_rate / 100),
            'line_total_ttc' => (float) $line->total_ttc,
        ];
    }

    /**
     * Verified against both a document-level threshold ("total > 5000")
     * and a per-line categorical case ("line_unit = Heure" correctly
     * differing across three lines with different units) before this
     * was written in.
     */
    private function stripConditionalBlocks(DOMXPath $xpath, $blocks, array $availableValues): void
    {
        $blocksArray = iterator_to_array($blocks);
        \Log::info('[Condition] stripConditionalBlocks called — found '.count($blocksArray).' block(s). Available values: '.json_encode($availableValues));

        foreach ($blocksArray as $block) {
            $keep = $this->evaluateCondition(
                $block->getAttribute('data-condition-var'),
                $block->getAttribute('data-condition-op'),
                $block->getAttribute('data-condition-value'),
                $availableValues
            );

            \Log::info(sprintf(
                '[Condition] var=%s op=%s value=%s => keep=%s',
                $block->getAttribute('data-condition-var'),
                $block->getAttribute('data-condition-op'),
                $block->getAttribute('data-condition-value'),
                $keep ? 'true' : 'false'
            ));

            if ($keep) {
                while ($block->firstChild) {
                    $block->parentNode->insertBefore($block->firstChild, $block);
                }
            }
            $block->parentNode->removeChild($block);
        }
    }

    private function evaluateCondition(string $var, string $op, string $value, array $availableValues): bool
    {
        if (! array_key_exists($var, $availableValues)) {
            return true; // unknown variable — fail open rather than hide content unexpectedly
        }

        $actual = $availableValues[$var];

        if (in_array($op, ['gt', 'gte', 'lt', 'lte'], true)) {
            if (! is_numeric($actual) || ! is_numeric($value)) {
                // A numeric comparison configured against non-numeric data
                // (e.g. "greater than" on a unit label) can't mean anything
                // real — fail closed instead of silently showing content
                // that was never meant to be unconditional.
                return false;
            }
            $actualNum = (float) $actual;
            $valueNum = (float) $value;

            return match ($op) {
                'gt' => $actualNum > $valueNum,
                'gte' => $actualNum >= $valueNum,
                'lt' => $actualNum < $valueNum,
                'lte' => $actualNum <= $valueNum,
            };
        }

        return match ($op) {
            'eq' => (string) $actual === (string) $value,
            'neq' => (string) $actual !== (string) $value,
            default => true,
        };
    }

    private function replaceSpan(DOMElement $span, string $value): void
    {
        $doc = $span->ownerDocument;
        if (! $doc || ! $span->parentNode) {
            return;
        }

        $isBold = $span->getAttribute('data-bold') === 'true';
        $isItalic = $span->getAttribute('data-italic') === 'true';
        $isUppercase = $span->getAttribute('data-uppercase') === 'true';
        $fontSize = $span->getAttribute('data-font-size');
        $color = $span->getAttribute('data-color');

        if (! $isBold && ! $isItalic && ! $isUppercase && $fontSize === '' && $color === '') {
            // No formatting was ever applied to this chip — plain text is
            // both simplest and exactly what previously worked.
            $span->parentNode->replaceChild($doc->createTextNode($value), $span);

            return;
        }

        if ($isUppercase) {
            $value = mb_strtoupper($value);
        }

        $style = [];
        if ($isBold) {
            $style[] = 'font-weight:bold';
        }
        if ($isItalic) {
            $style[] = 'font-style:italic';
        }
        if ($fontSize !== '') {
            $style[] = 'font-size:'.$fontSize;
        }
        if ($color !== '') {
            $style[] = 'color:'.$color;
        }

        $replacement = $doc->createElement('span');
        $replacement->setAttribute('style', implode(';', $style));
        $replacement->appendChild($doc->createTextNode($value)); // safe: DOM handles escaping, not a raw string insert
        $span->parentNode->replaceChild($replacement, $span);
    }
}