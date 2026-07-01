import * as functions from "firebase-functions"
import { onRequest } from "firebase-functions/v2/https"
import * as admin from "firebase-admin"

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

/**
 * Scheduled function that runs every minute to clean up stale online users.
 * Marks users as offline if their lastSeen timestamp is older than 2 minutes.
 * 
 * This handles:
 * - Browser crashes
 * - Task manager kills
 * - Network disconnections
 * - Mobile app backgrounding
 * - Any scenario where beforeunload doesn't fire
 */
export const cleanupStaleUsers = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context: functions.EventContext) => {
    try {
      // Calculate threshold: 2 minutes ago
      // This allows for 3-4 missed heartbeats (30s interval)
      const staleThreshold = Date.now() - (2 * 60 * 1000)
      const staleTime = admin.firestore.Timestamp.fromMillis(staleThreshold)

      // Query for online users with stale lastSeen
      const query = db
        .collection("online_users")
        .where("status", "==", "online")
        .where("lastSeen", "<", staleTime)

      const snapshot = await query.get()

      // No stale users found
      if (snapshot.empty) {
        functions.logger.info("No stale users found")
        return null
      }

      // Batch update all stale users to offline
      const batch = db.batch()
      snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        batch.update(doc.ref, {
          status: "offline",
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()

      functions.logger.info(
        `Marked ${snapshot.size} stale user(s) as offline`
      )

      return null
    } catch (error) {
      functions.logger.error("Error cleaning up stale users:", error)
      return null
    }
  })

/**
 * Optional: Manual trigger function for testing
 * Can be invoked via: firebase functions:shell
 * or via HTTP POST to the function URL
 */
export const manualCleanup = onRequest(
  async (req, res) => {
    try {
      // Reuse the same logic as the scheduled function
      const staleThreshold = Date.now() - (2 * 60 * 1000)
      const staleTime = admin.firestore.Timestamp.fromMillis(staleThreshold)

      const query = db
        .collection("online_users")
        .where("status", "==", "online")
        .where("lastSeen", "<", staleTime)

      const snapshot = await query.get()

      if (snapshot.empty) {
        res.json({
          success: true,
          message: "No stale users found",
          cleaned: 0,
        })
        return
      }

      const batch = db.batch()
      snapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        batch.update(doc.ref, {
          status: "offline",
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()

      res.json({
        success: true,
        message: `Marked ${snapshot.size} stale user(s) as offline`,
        cleaned: snapshot.size,
        users: snapshot.docs.map((doc) => doc.id),
      })
    } catch (error) {
      functions.logger.error("Error in manual cleanup:", error)
      res.status(500).json({
        success: false,
        error: "Failed to clean up stale users",
      })
    }
  }
)
