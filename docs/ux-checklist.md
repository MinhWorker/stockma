# StockMa UX Checklist

Use this checklist when auditing or changing screens for users who are not very
comfortable with technology.

## Copy And Labels

- Does each primary button say exactly what it does?
- Are destructive or financial actions named clearly before the user commits?
- Are labels written in everyday Vietnamese rather than internal model terms?
- Are validation messages specific enough for the user to fix the problem?

## Screen Flow

- Can the user tell what to do first without reading documentation?
- Are optional sections hidden until the user chooses to use them?
- Does each success state make the completed action obvious?
- Does the screen offer the next natural action after success?

## Inventory-Specific Checks

- Stock-in explains when default purchase price is used.
- Stock-out explains when default sale price is used.
- Product variants are highlighted when they affect stock or price.
- Retail-only fields such as gifts and debts are not shown too early.
- Return/exchange fields make the difference between returned quantity and
  replacement quantity clear.

## Mobile Usability

- Test the flow at around 390px wide.
- Check that labels, helper text, and buttons do not overlap or truncate.
- Prefer clear vertical grouping over dense side-by-side controls.
- Keep repeated actions near the bottom where mobile users expect to submit.

## Agent Review Notes

When reporting UX issues, include:

- Screen or route.
- User confusion risk.
- Suggested copy or interaction change.
- Whether it blocks task completion or is a polish issue.
