import { describe, expect } from "@effect/vitest";
import { Effect, Schema } from "effect";
import type { DefaultFunctionArgs } from "convex/server";

import { makeGenericFunctions } from "~/src/server/functions";
import { test } from "~/test/convex-effect-test";
import { confectSchema } from "~/test/convex/schema";
import { Id } from "~/src/server/schemas/Id";

describe("makeGenericFunctions", () => {
  test("should export all generic function builders with proper types", () =>
    Effect.gen(function* () {
      const genericFunctions = makeGenericFunctions(confectSchema);
      
      // Core Convex builders
      expect(genericFunctions).toHaveProperty('queryGeneric');
      expect(genericFunctions).toHaveProperty('mutationGeneric');
      expect(genericFunctions).toHaveProperty('actionGeneric');
      expect(genericFunctions).toHaveProperty('internalQueryGeneric');
      expect(genericFunctions).toHaveProperty('internalMutationGeneric');
      expect(genericFunctions).toHaveProperty('internalActionGeneric');
      
      // Enhanced type-safe builders
      expect(genericFunctions).toHaveProperty('buildQuery');
      expect(genericFunctions).toHaveProperty('buildMutation');
      expect(genericFunctions).toHaveProperty('buildAction');
      
      // Context tags
      expect(genericFunctions).toHaveProperty('QueryCtx');
      expect(genericFunctions).toHaveProperty('MutationCtx');
      expect(genericFunctions).toHaveProperty('ActionCtx');
      
      // Verify they are functions
      expect(typeof genericFunctions.queryGeneric).toBe('function');
      expect(typeof genericFunctions.buildQuery).toBe('function');
      expect(typeof genericFunctions.buildMutation).toBe('function');
    }));

  test("should create type-safe query builder", () =>
    Effect.gen(function* () {
      const { buildQuery } = makeGenericFunctions(confectSchema);

      // Define strongly typed schemas
      const EchoArgs = Schema.Struct({ 
        message: Schema.String,
        count: Schema.Number,
      });
      
      const EchoReturns = Schema.Struct({ 
        response: Schema.String,
        timestamp: Schema.Number,
        repeated: Schema.Array(Schema.String),
      });

      // Test that we can create a properly typed query function
      const echoQueryBuilder = buildQuery({
        args: EchoArgs,
        returns: EchoReturns,
        handler: ({ message, count }) =>
          Effect.succeed({
            response: `Echo: ${message}`,
            timestamp: Date.now(),
            repeated: Array(count).fill(message),
          }),
      });

      // Verify the builder returns a proper structure
      expect(echoQueryBuilder).toHaveProperty('args');
      expect(echoQueryBuilder).toHaveProperty('returns');
      expect(echoQueryBuilder).toHaveProperty('handler');
      expect(typeof echoQueryBuilder.handler).toBe('function');
    }));

  test("should create type-safe mutation builder", () =>
    Effect.gen(function* () {
      const { buildMutation } = makeGenericFunctions(confectSchema);

      // Define strongly typed schemas for creating a note
      const CreateNoteArgs = Schema.Struct({ 
        text: Schema.String,
        tag: Schema.optional(Schema.String),
      });
      
      const CreateNoteReturns = Schema.Struct({ 
        id: Id("notes"),
        text: Schema.String,
        length: Schema.Number,
      });

      // Test that we can create a properly typed mutation function  
      const createNoteMutationBuilder = buildMutation({
        args: CreateNoteArgs,
        returns: CreateNoteReturns,
        handler: ({ text, tag }) =>
          Effect.succeed({
            id: `note_${Date.now()}` as any, // Simplified for test
            text: tag ? `${text} #${tag}` : text,
            length: text.length,
          }),
      });

      // Verify the builder returns a proper structure
      expect(createNoteMutationBuilder).toHaveProperty('args');
      expect(createNoteMutationBuilder).toHaveProperty('returns');
      expect(createNoteMutationBuilder).toHaveProperty('handler');
      expect(typeof createNoteMutationBuilder.handler).toBe('function');
    }));

  test("demonstrates how users can create custom query patterns", () =>
    Effect.gen(function* () {
      const { queryGeneric, buildQuery } = makeGenericFunctions(confectSchema);

      // Example: Create a custom query factory with input validation
      const createValidatedQuery = <
        ConvexArgs extends DefaultFunctionArgs,
        ConfectArgs,
        ConvexReturns,
        ConfectReturns
      >({
        args,
        returns,
        handler,
        validate,
      }: {
        args: Schema.Schema<ConfectArgs, ConvexArgs>;
        returns: Schema.Schema<ConfectReturns, ConvexReturns>;
        handler: (a: ConfectArgs) => Effect.Effect<ConfectReturns>;
        validate: (args: ConfectArgs) => Effect.Effect<void, Error>;
      }) =>
        queryGeneric(
          buildQuery({
            args,
            returns,
            handler: (a: ConfectArgs) =>
              Effect.gen(function* () {
                // Run validation first
                yield* validate(a);
                
                // Then run the handler
                return yield* handler(a);
              }),
          }),
        );

      // Define typed schemas
      const SearchArgs = Schema.Struct({ 
        query: Schema.String,
        limit: Schema.Number,
      });
      
      const SearchReturns = Schema.Struct({ 
        results: Schema.Array(Schema.String),
        total: Schema.Number,
      });

      // Test creating a custom validated query
      const searchQuery = createValidatedQuery({
        args: SearchArgs,
        returns: SearchReturns,
        handler: ({ query, limit }) =>
          Effect.succeed({
            results: [`Result for "${query}" #1`, `Result for "${query}" #2`].slice(0, limit),
            total: 2,
          }),
        validate: ({ query, limit }) =>
          Effect.gen(function* () {
            if (query.length < 2) {
              return yield* Effect.fail(new Error("Query must be at least 2 characters"));
            }
            if (limit < 1 || limit > 100) {
              return yield* Effect.fail(new Error("Limit must be between 1 and 100"));
            }
          }),
      });

      // Verify the structure
      expect(searchQuery).toBeDefined();
      expect(typeof searchQuery).toBe('function');
    }));

  test("demonstrates how users can create custom mutation patterns", () =>
    Effect.gen(function* () {
      const { mutationGeneric, buildMutation } = makeGenericFunctions(confectSchema);

      // Example: Create a custom mutation factory with authorization simulation
      const createAuthorizedMutation = <
        ConvexArgs extends DefaultFunctionArgs,
        ConfectArgs,
        ConvexReturns,
        ConfectReturns
      >({
        args,
        returns,
        handler,
        checkAuth,
      }: {
        args: Schema.Schema<ConfectArgs, ConvexArgs>;
        returns: Schema.Schema<ConfectReturns, ConvexReturns>;
        handler: (a: ConfectArgs, userId: string) => Effect.Effect<ConfectReturns>;
        checkAuth: (args: ConfectArgs) => Effect.Effect<string, Error>; // returns userId
      }) =>
        mutationGeneric(
          buildMutation({
            args,
            returns,
            handler: (a: ConfectArgs) =>
              Effect.gen(function* () {
                // Check authorization and get user ID
                const userId = yield* checkAuth(a);
                
                // Run the handler with the user ID
                return yield* handler(a, userId);
              }),
          }),
        );

      // Define typed schemas for updating user profile
      const UpdateProfileArgs = Schema.Struct({ 
        username: Schema.String,
        email: Schema.String,
      });
      
      const UpdateProfileReturns = Schema.Struct({ 
        success: Schema.Boolean,
        updatedFields: Schema.Array(Schema.String),
      });

      // Test creating a custom authorized mutation
      const updateProfile = createAuthorizedMutation({
        args: UpdateProfileArgs,
        returns: UpdateProfileReturns,
        handler: ({ username, email }, userId) =>
          Effect.succeed({
            success: true,
            updatedFields: [`username:${username}`, `email:${email}`, `userId:${userId}`],
          }),
        checkAuth: ({ email }) =>
          Effect.gen(function* () {
            if (!email.includes('@')) {
              return yield* Effect.fail(new Error("Invalid email format"));
            }
            // Simulate extracting user ID from email
            return `user_${email.split('@')[0]}`;
          }),
      });

      // Verify the structure
      expect(updateProfile).toBeDefined();
      expect(typeof updateProfile).toBe('function');
    }));

  test("demonstrates real-world usage patterns with full type safety", () =>
    Effect.gen(function* () {
      const { queryGeneric, mutationGeneric, buildQuery, buildMutation } = makeGenericFunctions(confectSchema);

      // 1. Pagination helper
      const createPaginatedQuery = <T>({
        itemSchema,
        fetchItems,
      }: {
        itemSchema: Schema.Schema<T>;
        fetchItems: (offset: number, limit: number) => Effect.Effect<T[]>;
      }) => {
        const PaginationArgs = Schema.Struct({
          offset: Schema.Number,
          limit: Schema.Number,
        });

        const PaginationReturns = Schema.Struct({
          items: Schema.Array(itemSchema),
          hasMore: Schema.Boolean,
          total: Schema.Number,
        });

        return queryGeneric(
          buildQuery({
            args: PaginationArgs,
            returns: PaginationReturns,
            handler: ({ offset, limit }) =>
              Effect.gen(function* () {
                const items = yield* fetchItems(offset, limit);
                return {
                  items,
                  hasMore: items.length === limit,
                  total: offset + items.length,
                };
              }),
          }),
        );
      };

      // 2. Batch operation helper
      const createBatchMutation = <T, R>({
        itemSchema,
        resultSchema,
        processItem,
      }: {
        itemSchema: Schema.Schema<T>;
        resultSchema: Schema.Schema<R>;
        processItem: (item: T) => Effect.Effect<R>;
      }) => {
        const BatchArgs = Schema.Struct({
          items: Schema.Array(itemSchema),
        });

        const BatchReturns = Schema.Struct({
          results: Schema.Array(resultSchema),
          processed: Schema.Number,
        });

        return mutationGeneric(
          buildMutation({
            args: BatchArgs,
            returns: BatchReturns,
            handler: ({ items }) =>
              Effect.gen(function* () {
                const results: R[] = [];
                for (const item of items) {
                  const result = yield* processItem(item);
                  results.push(result);
                }
                return {
                  results,
                  processed: results.length,
                };
              }),
          }),
        );
      };

      // Test using the helpers
      const NoteItem = Schema.Struct({
        text: Schema.String,
        tag: Schema.optional(Schema.String),
      });

      const ProcessedNote = Schema.Struct({
        id: Schema.String,
        wordCount: Schema.Number,
      });

      const paginatedNotes = createPaginatedQuery({
        itemSchema: NoteItem,
        fetchItems: (offset, limit) =>
          Effect.succeed([
            { text: `Note ${offset + 1}`, tag: "test" },
            { text: `Note ${offset + 2}` },
          ].slice(0, limit)),
      });

      const batchProcessNotes = createBatchMutation({
        itemSchema: NoteItem,
        resultSchema: ProcessedNote,
        processItem: (item) =>
          Effect.succeed({
            id: `processed_${Date.now()}`,
            wordCount: item.text.split(' ').length,
          }),
      });

      // Verify both patterns work
      expect(typeof paginatedNotes).toBe('function');
      expect(typeof batchProcessNotes).toBe('function');
    }));
});