/*
 * Utilities
 */
var btoa = require('btoa')

function generateRandomId() {
    const charCount = 9 // No dupes in 100 runs of one million
    const charSet = "abcdefghijklmnopqrstuvwxyz0123456789"
    const charSetSize = charSet.length
    let id = ''
    for (let i = 1; i <= charCount; i++) {
        const randPos = Math.floor(Math.random() * charSetSize)
        id += charSet[randPos]
    }
    return id
}

function timeAsString(time) {

    // Modeled after base64 web-safe chars, but ordered by ASCII.
    var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

    var now = time ? time : Date.now()

    var timeStampChars = new Array(10)
    for (var i = 9; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64)
        now = Math.floor(now / 64)
    }

    if (now !== 0) throw new Error('We should have converted the entire timestamp.')
    var id = timeStampChars.join('')

    return id
}

function reverseString(str) {
    return str.split('').reverse().join('')
}

function checkDuplicates(count) {
    const hash = {}
    const dupe = []
    for (let idx = 0; idx < count; ++idx) {
        const gen = generateRandomId() // generate our unique ID

        // if it already exists, then it has been duplicated
        if (typeof hash[gen] != 'undefined') {
            dupe.push({
                duplicate: gen,
                indexCreated: hash[gen],
                indexDuplicated: idx
            })
        }
        hash[gen] = idx
    }
    return dupe
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
function generatePushID(time) {

    // Modeled after base64 web-safe chars, but ordered by ASCII.
    var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'

    // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
    var lastPushTime = 0

    // We generate 72-bits of randomness which get turned into 12 characters and appended to the
    // timestamp to prevent collisions with other clients.  We store the last characters we
    // generated because in the event of a collision, we'll use those same characters except
    // "incremented" by one.
    var lastRandChars = []

    var now = time ? time : Date.now()
    var duplicateTime = (now === lastPushTime)
    lastPushTime = now

    var timeStampChars = new Array(8)
    for (var i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64)
            // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
        now = Math.floor(now / 64)
    }

    if (now !== 0) throw new Error('We should have converted the entire timestamp.')

    var id = timeStampChars.join('')

    if (!duplicateTime) {
        for (i = 0; i < 12; i++) {
            lastRandChars[i] = Math.floor(Math.random() * 64)
        }
    }
    else {
        // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
            lastRandChars[i] = 0
        }
        lastRandChars[i]++
    }
    for (i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i])
    }
    if (id.length != 20) throw new Error('Length should be 20.')

    return id
}

function tagFromName(name, minLength) {
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
    if (tag.length < minLength) tag = (tag + 'xxxxxxxxxx').substring(0, minLength)
    if (tag.length > 21) tag = tag.substring(0, 21)
    return tag
}

function slugFromName(name, maxLength) {
    /* 
     * Examples:
     * Slack channels: lowercase letters, numbers, hyphens, 21 chars max.
     * 
     * Rules: 
     * - lowercase letters, numbers, hyphens
     */
    let maxLen = maxLength || 100
    let tag = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
    tag = tag.replace(/\s+/g, ' ') // replace multiple spaces with single space 
    tag = tag.replace(/\s/g, '-') // replace spaces with hyphens
    if (tag.length > maxLen) tag = tag.substring(0, maxLen)
    return tag
}

function emailToKey(emailAddress) {
    return btoa(emailAddress)
}

let errors = {
    permission_denied: {
        code: 403,
        message: "Permission denied",
    },
    not_found_invite: {
        code: 404.1,
        message: "Invite missing or revoked",
    },
    invalid_invite: {
        code: 404.2,
        message: "Invite invalid",
    },
    not_found_group: {
        code: 404.10,
        message: "Group missing",
    }
}

exports.errors = errors
exports.tagFromName = tagFromName
exports.slugFromName = slugFromName
exports.generatePushID = generatePushID
exports.generateRandomId = generateRandomId
exports.checkDuplicates = checkDuplicates 
exports.timeAsString = timeAsString
exports.reverseString = reverseString
exports.emailToKey = emailToKey