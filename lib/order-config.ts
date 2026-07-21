// Maps a path (relative to the notes/ folder, forward slashes, no file
// extension) to an explicit sort order. Lower numbers appear first.
// Applies at every tree level independently -- e.g. "windows" and
// "windows/event-id" are ordered separately from each other.
//
// Anything NOT listed here keeps the default behavior: folders before
// files, then alphabetical. You only need to add entries for the items
// you actually want to reposition -- everything else stays automatic.
//
// To find the right key for an item, use its path as shown in the
// sidebar, e.g.:
//   "kerberos"                                  (top-level folder)
//   "windows"                                    (top-level folder)
//   "windows/event-id"                           (subfolder)
//   "windows/event-id/account-management"        (subfolder)
//   "windows/event-id/important-event-id"        (a note file)

export const orderConfig: Record<string, number> = {
  // Top-level categories
  kerberos: 2,
  kql: 1,
  splunk: 3,
  windows: 4,

  // Inside windows/
  "windows/event-id": 1,
  "windows/defender": 2,
  "windows/firewall-network": 3,
  "windows/object-access": 4,
  "windows/persistence": 5,
  "windows/process-execution": 6,
  "windows/usb-device-monitoring": 7,

  // Inside windows/event-id/
  "windows/event-id/account-management": 1,
  "windows/event-id/authentication-logon": 2,
  // Inside windows/event-id/persistence/
  "windows/event-id/persistence/assessment": 5,
  "windows/event-id/persistence/4657": 1,
  "windows/event-id/persistence/4697": 4,
  "windows/event-id/persistence/4698": 6,
  "windows/event-id/persistence/4699": 7,
  "windows/event-id/persistence/4700": 8,
  "windows/event-id/persistence/4701": 9,



}

// Strips the file extension so a TreeItem's raw path (which may end in
// .md, .mdx, or .json) matches the keys above, which never include one.
export function orderKeyFor(itemPath: string): string {
  return itemPath.replace(/\.(mdx?|json)$/i, "")
}
