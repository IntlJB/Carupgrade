# Navigation order design

## Goal

Make the primary navigation follow the homepage section order by placing “Sådan fungerer det” before “Services”.

## Scope

Update the primary navigation in `index.html` and the five secondary-page HTML files. Swap only the two existing list items; preserve their labels, anchors, styling, and surrounding menu order. Footer navigation remains unchanged.

## Verification

Confirm every primary `nav-links` list starts with “Sådan fungerer det” followed by “Services”, and confirm both links still target `#hvordan` and `#services` respectively (using root-prefixed anchors on secondary pages).
