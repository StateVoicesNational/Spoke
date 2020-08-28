# Texter ShortCuts and when they are displayed

On the texter conversation screen, the UI creates "shortcut buttons" for some question responses
and canned replies.

Currently there is no UI to choose the shortcuts or enable/disable them or preview their visibility,
however we hope to do that in the future.

In the meantime we document the rules of when they are shown automatically.  These rules are meant
to balance real-estate on the screen while avoiding confusion for the texter in some situations.

## Terminology

* A Canned Reply is one of the options set in a campaign that is separate from the hierarchical survey.
* A Question Response is an Answer value (seen by the texter) to a question in Interactions in a campaign.
  Question Responses are contextual to which question responses have been chosen before in a conversation
  -- i.e. it's a "choose your own adventure"-tree of choices.
* A 'label' is the option (question response or canned reply) in full, unless there is punctuation
  after the first word.  e.g. "Yes, but ..." will have a label of "Yes", but "Yes but X" will have a
  label of "Yes but X" -- A good way to add context to the All Responses menu is put something after
  a comma or a colon.

## Rules

* Canned Responses, by default, will not show unless they have 12 characters or less.
  * Prefix a Canned Response with a '+' (plus character) to force it to be shown (even with more than 12 characters)
  * Prefix a Canned Response with a '-' (minus character) to force that response never to be shown as a button
  * Only remaining room will be used for Canned Response shortcuts.
* Question Responses do NOT respond to a '+' -- by default they are included regardless of label width.
  * Adding punctuation after the first word in a question response will shorten the Label to the first word
  * Prefix a Question Response with a '-' (minus character) to force exclude that response in the shortcut options.
    This is useful, if you have a common one or two responses, but you want the 'special cases' in question response not
    to be shown, in favor of some Canned Response shortcuts.
  * Question response button labels must be less than 36 characters in total with an extra 2 characters
    subtracted per option (for space between buttons)
* If any labels (shortened or otherwise) are the same, then no shortcuts will be shown.
* If there is a present Question with Question Response Options but they are not shown as shortcuts
  (because of duplication, too many or too long), then no Canned Response shortcuts will be shown either.
  This is to focus the texter on whatever the current Question is.

## Examples

1. Common case:
   * Question Response Answers: "Yes", "No"
   * Canned Response Titles: "Wrong Number", "Moved", "Who are you?"
   * Resulting Shortcuts: [Yes] [No] [Wrong Number] [Moved]
   * Reasoning: All the canned responses are 12 characters or less.
     It doesn't include the "Who are you?" because the buttons included add up to 30 characters
     (3+2)+(2+2)+(12+2)+(5+2) and adding "Who are you?" would go past 36.

2. Pluses and Minuses
   * Question Response Answers: "Yes: I voted", "No", "-Yes but I Moved"
   * Canned Response Titles: "-Who are you?", +I don't understand", "+Wrong Number"
   * Resulting Shortcuts: [Yes] [No] [I don't understand]
   * Reasoning: "Yes: I voted" was shortened to "Yes" because there is punctuation right after the first word.
     "-Yes but I Moved" was excluded because it starts with a "-" sign.  All the non-prefixed Question Responses
     fit, so we add Canned Responses in order.  The first is excluded because it starts with "-".  "+I don't understand"
     would normally not be included because it has more than 12 characters, but it starts with a "+" so we include
     it anyway. "+Wrong Number" would be included if there was space but there is not, so the shortcuts are just the three.
