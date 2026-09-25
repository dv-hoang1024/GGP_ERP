# Login Page Override

This page uses the official GG Power logo and watercolor facility artwork supplied in the project resources.

## Layout

- Desktop (`> 880px`): 58% brand artwork and 42% authentication area.
- Tablet (`481px–880px`): centered card on a quiet green-tinted background.
- Phone (`<= 480px`): full-width white authentication surface with no horizontal overflow.
- Keep all native Frappe authentication states and routes functional.

## Visual Tokens

- Brand green: `#119C4A`
- Accessible action green: `#087338`
- Brand orange: `#F5821F`
- Primary text: `#17352A`
- Secondary text: `#5C6F66`
- Border: `#D8E7DE`
- Background: `#F4FAF6`
- Card: `#FFFFFF`

## Interaction and Accessibility

- Inputs and primary actions are at least 48px high.
- Preserve visible labels, password-manager support, paste, inline errors, and email-link authentication.
- Use a visible green focus ring and never remove keyboard focus indication.
- Respect `prefers-reduced-motion`.
- The logo must have `alt="GG Power"`; the facility artwork is decorative.
