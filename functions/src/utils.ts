/*
 * Utilities
 */
export function generateRandomId(digits: number): string {
    // No dupes in 100 runs of one million if using 9
    const charSet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const charSetSize = charSet.length
    let id = ''
    for (let i = 1; i <= digits; i++) {
        const randPos = Math.floor(Math.random() * charSetSize)
        id += charSet[randPos]
    }
    return id
}

export function timeAsString(time: number): string {
    // Modeled after base64 web-safe chars, but ordered by ASCII.
    const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'
    let now = time ? time : Date.now()
    const timeStampChars = new Array(10)
    for (let i = 9; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64)
        now = Math.floor(now / 64)
    }
    if (now !== 0) {
        throw new Error('We should have converted the entire timestamp.')
    }
    return timeStampChars.join('')
}

export function reverseString(s: string): string {
    return s.split('').reverse().join('')
}

export function checkDuplicates(count: number): any[] {
    type Dupe = { duplicate: string, indexCreated: {}, indexDuplicated: number }
    const hash = {}
    const dupes: Dupe[] = []
    for (let idx = 0; idx < count; ++idx) {
        const gen = generateRandomId(9) // generate our unique ID
        // if it already exists, then it has been duplicated
        if (typeof hash[gen] !== 'undefined') {
            dupes.push({
                duplicate: gen,
                indexCreated: hash[gen],
                indexDuplicated: idx,
            })
        }
        hash[gen] = idx
    }
    return dupes
}

/**
 * Fancy ID generator that creates 20-character string identifiers with the following properties:
 *
 * 1. They're based on timestamp so that they sort *after* any existing ids.
 * 2. They contain 72-bits of random data after the timestamp so that IDs won't collide with other clients' IDs.
 * 3. They sort *lexicographically* (so the timestamp is converted to characters that will sort properly).
 * 4. They're monotonically increasing.  Even if you generate more than one in the same timestamp, the
 *    latter ones will sort after the former ones.  We do this by using the previous random bits
 *    but "incrementing" them by 1 (only in the case of a timestamp collision).
 */
export function generatePushID(time: number): string {

    // Modeled after base64 web-safe chars, but ordered by ASCII.
    const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

    // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
    let lastPushTime = 0

    // We generate 72-bits of randomness which get turned into 12 characters and appended to the
    // timestamp to prevent collisions with other clients.  We store the last characters we
    // generated because in the event of a collision, we'll use those same characters except
    // "incremented" by one.
    const lastRandChars: number[] = []

    let now = time ? time : Date.now()
    const duplicateTime = (now === lastPushTime)
    lastPushTime = now

    const timeStampChars = new Array(8)
    for (let i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64)
            // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
        now = Math.floor(now / 64)
    }

    if (now !== 0) {
        throw new Error('We should have converted the entire timestamp.')
    }

    let id = timeStampChars.join('')

    if (!duplicateTime) {
        for (let i = 0; i < 12; i++) {
            lastRandChars[i] = Math.floor(Math.random() * 64)
        }
    }
    else {
        // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
        let last = 11
        for (let i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
            lastRandChars[i] = 0
            last = i
        }
        lastRandChars[last]++
    }
    for (let i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i])
    }
    if (id.length !== 20) {
        throw new Error('Length should be 20.')
    }

    return id
}

export function tagFromName(name: string, minLength: number): string {
    /*
     * Examples:
     * Slack usernames: lowercase letters, numbers, periods, hyphens, underscores, 21 chars max.
     * Twitter usernames: letters, numbers, underscores, 15 chars max. case insensitive
     *
     * Rules:
     * - lowercase letters, numbers, periods, hyphens, underscores.
     * - 4 chars min, 21 chars max.
     * - must start with letter or number.
     */
    let tag = name.toLowerCase().replace(/[^A-Za-z0-9_.-]/g, '')
    if (tag.length < minLength) {
        tag = (tag + 'xxxxxxxxxx').substring(0, minLength)
    }
    if (tag.length > 21) {
        tag = tag.substring(0, 21)
    }
    return tag
}

export function slugFromName(name: string, maxLength: number): string {
    /*
     * Examples:
     * Slack channels: lowercase letters, numbers, hyphens, 21 chars max.
     *
     * Rules:
     * - lowercase letters, numbers, hyphens
     */
    const maxLen = maxLength || 100
    let tag = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
    tag = tag.replace(/\s+/g, ' ') // replace multiple spaces with single space
    tag = tag.replace(/\s/g, '-') // replace spaces with hyphens
    if (tag.length > maxLen) {
        tag = tag.substring(0, maxLen)
    }
    return tag
}

export const errors = {
    permission_denied: {
        code: 403,
        message: '403 Permission denied',
    },
    not_found_invite: {
        code: 404.1,
        message: '404.1 Invite missing or revoked',
    },
    invalid_invite: {
        code: 404.2,
        message: '404.2 Invite invalid',
    },
    not_found_group: {
        code: 404.10,
        message: '404.10 Group missing',
    },
}
