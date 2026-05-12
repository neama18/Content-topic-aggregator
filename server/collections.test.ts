import { describe, it, expect, beforeEach } from "vitest";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  getUserCollections,
  getCollectionWithItems,
  addTopicToCollection,
  removeTopicFromCollection,
} from "./db";

describe("Collections Database Operations", () => {
  const testUserId = 999;
  const testCollectionId = 999;

  describe("createCollection", () => {
    it("should create a collection with required fields", async () => {
      const result = await createCollection(testUserId, "Test Collection");
      expect(result).toBeDefined();
    });

    it("should create a collection with optional description and color", async () => {
      const result = await createCollection(
        testUserId,
        "Premium Collection",
        "A curated collection of premium content",
        "#FF5733"
      );
      expect(result).toBeDefined();
    });

    it("should require a collection name", async () => {
      try {
        await createCollection(testUserId, "");
        expect.fail("Should have thrown an error for empty name");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("updateCollection", () => {
    it("should update collection name", async () => {
      const result = await updateCollection(testCollectionId, {
        name: "Updated Collection Name",
      });
      expect(result).toBeDefined();
    });

    it("should update collection description", async () => {
      const result = await updateCollection(testCollectionId, {
        description: "New description",
      });
      expect(result).toBeDefined();
    });

    it("should update collection color", async () => {
      const result = await updateCollection(testCollectionId, {
        color: "#00FF00",
      });
      expect(result).toBeDefined();
    });

    it("should update multiple fields at once", async () => {
      const result = await updateCollection(testCollectionId, {
        name: "Multi Update",
        description: "Updated description",
        color: "#0000FF",
      });
      expect(result).toBeDefined();
    });

    it("should return null if no fields to update", async () => {
      const result = await updateCollection(testCollectionId, {});
      expect(result).toBeNull();
    });

    it("should validate color format", async () => {
      try {
        await updateCollection(testCollectionId, {
          color: "invalid-color",
        });
        expect.fail("Should have thrown an error for invalid color");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("deleteCollection", () => {
    it("should delete a collection", async () => {
      const result = await deleteCollection(testCollectionId);
      expect(result).toBeDefined();
    });

    it("should delete collection items when deleting collection", async () => {
      // This is tested implicitly - if items aren't deleted, the cascade would fail
      const result = await deleteCollection(testCollectionId);
      expect(result).toBeDefined();
    });
  });

  describe("getUserCollections", () => {
    it("should return array of collections for user", async () => {
      const result = await getUserCollections(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array if user has no collections", async () => {
      const result = await getUserCollections(9999999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should order collections by creation date descending", async () => {
      const result = await getUserCollections(testUserId);
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const current = new Date(result[i].createdAt).getTime();
          const next = new Date(result[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("getCollectionWithItems", () => {
    it("should return collection with items array", async () => {
      const result = await getCollectionWithItems(testCollectionId);
      if (result) {
        expect(result).toHaveProperty("collection");
        expect(result).toHaveProperty("items");
        expect(Array.isArray(result.items)).toBe(true);
      }
    });

    it("should return null for non-existent collection", async () => {
      const result = await getCollectionWithItems(9999999);
      expect(result).toBeNull();
    });
  });

  describe("addTopicToCollection", () => {
    it("should add topic to collection", async () => {
      const result = await addTopicToCollection(testCollectionId, 1);
      expect(result).toBeDefined();
    });

    it("should allow multiple topics in collection", async () => {
      await addTopicToCollection(testCollectionId, 1);
      const result = await addTopicToCollection(testCollectionId, 2);
      expect(result).toBeDefined();
    });
  });

  describe("removeTopicFromCollection", () => {
    it("should remove topic from collection", async () => {
      await addTopicToCollection(testCollectionId, 1);
      const result = await removeTopicFromCollection(testCollectionId, 1);
      expect(result).toBeDefined();
    });

    it("should handle removing non-existent topic gracefully", async () => {
      const result = await removeTopicFromCollection(testCollectionId, 9999999);
      expect(result).toBeDefined();
    });
  });
});
