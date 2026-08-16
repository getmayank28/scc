export const CHANNEL = {
    CARD_RECOMMENDATION: 'recommendation'
}

/**
 * Human-readable names for the partner bot's channels, used when a session has
 * no usable title of its own and we label it by what kind of chat it was.
 *
 * Kept to a single short word on purpose. These render in a 190px sidebar row
 * at text-xs, which truncates past roughly 30 characters — a longer label eats
 * the timestamp beside it, and the timestamp is the part that actually tells
 * two untitled sessions apart. "Match" also echoes the "Last 5 Matches" heading
 * the rows sit under.
 *
 * Deliberately a lookup with no fallback string: an unknown channel renders no
 * label at all rather than a raw slug like `card_offers`, so a channel the bot
 * adds before we do cannot leak its internal name into the sidebar.
 */
export const CHANNEL_LABEL: Record<string, string> = {
    [CHANNEL.CARD_RECOMMENDATION]: 'Match',
}