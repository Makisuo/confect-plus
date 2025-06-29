import { describe, expect } from "@effect/vitest";
import { Effect, Schema } from "effect";

import { 
  makeGenericFunctions, 
  type ConfectQueryHandler,
  type ConfectMutationHandler,
} from "~/src/server/functions";
import { test } from "~/test/convex-effect-test";
import { confectSchema } from "~/test/convex/schema";

// Example data model patterns for testing - blog/social media app structure:
// - users: { username, email, role: "admin" | "user" | "moderator" }
// - posts: { title, content, authorId, published, tags[] }
// - comments: { postId, authorId, content, approved }

describe("makeGenericFunctions", () => {
  test("should export all generic function builders", () =>
    Effect.gen(function* () {
      const genericFunctions = makeGenericFunctions(confectSchema);
      
      expect(genericFunctions).toHaveProperty('queryGeneric');
      expect(genericFunctions).toHaveProperty('mutationGeneric');
      expect(genericFunctions).toHaveProperty('actionGeneric');
      expect(genericFunctions).toHaveProperty('internalQueryGeneric');
      expect(genericFunctions).toHaveProperty('internalMutationGeneric');
      expect(genericFunctions).toHaveProperty('internalActionGeneric');
      expect(genericFunctions).toHaveProperty('confectQueryFunction');
      expect(genericFunctions).toHaveProperty('confectMutationFunction');
      expect(genericFunctions).toHaveProperty('confectActionFunction');
      
      // Verify they are functions
      expect(typeof genericFunctions.queryGeneric).toBe('function');
      expect(typeof genericFunctions.confectQueryFunction).toBe('function');
      expect(typeof genericFunctions.confectMutationFunction).toBe('function');
    }));

  test("should create confectQueryFunction builder", () =>
    Effect.gen(function* () {
      const { confectQueryFunction } = makeGenericFunctions(confectSchema);

      // Test that we can create a basic confect query function
      const basicQueryBuilder = confectQueryFunction({
        args: Schema.Struct({ 
          message: Schema.String,
        }),
        returns: Schema.Struct({ 
          response: Schema.String,
        }),
        handler: ({ message }) =>
          Effect.succeed({
            response: `Echo: ${message}`,
          }),
      });

      // Verify the builder returns a proper structure
      expect(basicQueryBuilder).toHaveProperty('args');
      expect(basicQueryBuilder).toHaveProperty('returns');
      expect(basicQueryBuilder).toHaveProperty('handler');
      expect(typeof basicQueryBuilder.handler).toBe('function');
    }));

  test("should create confectMutationFunction builder", () =>
    Effect.gen(function* () {
      const { confectMutationFunction } = makeGenericFunctions(confectSchema);

      // Test that we can create a basic confect mutation function
      const basicMutationBuilder = confectMutationFunction({
        args: Schema.Struct({ 
          text: Schema.String,
        }),
        returns: Schema.Struct({ 
          id: Schema.String,
        }),
        handler: ({ text }) =>
          Effect.succeed({
            id: `note-${text.length}-${Date.now()}`,
          }),
      });

      // Verify the builder returns a proper structure
      expect(basicMutationBuilder).toHaveProperty('args');
      expect(basicMutationBuilder).toHaveProperty('returns');
      expect(basicMutationBuilder).toHaveProperty('handler');
      expect(typeof basicMutationBuilder.handler).toBe('function');
    }));

  test("demonstrates how to create custom userQuery pattern", () =>
    Effect.gen(function* () {
      const { queryGeneric, confectQueryFunction } = makeGenericFunctions(confectSchema);

      // Example of how users would create their own userQuery function
      const createUserQuery = <Args, Returns>({
        args,
        returns,
        handler,
      }: {
        args: Schema.Schema<Args, any>;
        returns: Schema.Schema<Returns, any>;
        handler: ConfectQueryHandler<any, Args, Returns>;
      }) =>
        queryGeneric(
          confectQueryFunction({
            args,
            returns,
            handler: (a: Args) =>
              Effect.gen(function* () {
                // This is where auth checking would happen in a real implementation:
                // const ctx = yield* ConfectQueryCtx();
                // const userIdentity = yield* ctx.auth.getUserIdentity();
                // if (Option.isNone(userIdentity)) {
                //   return yield* Effect.fail(new Error("Unauthorized"));
                // }
                
                // For demonstration, we just proceed with the handler
                return yield* handler(a);
              }),
          }),
        );

      // Test creating a user query
      const getUserProfile = createUserQuery({
        args: Schema.Struct({ userId: Schema.String }),
        returns: Schema.Struct({ 
          username: Schema.String,
          role: Schema.String,
        }),
        handler: ({ userId }) =>
          Effect.succeed({
            username: `user-${userId}`,
            role: "user",
          }),
      });

      // Verify the structure
      expect(getUserProfile).toBeDefined();
      expect(typeof getUserProfile).toBe('function');
    }));

  test("demonstrates how to create custom validatedMutation pattern", () =>
    Effect.gen(function* () {
      const { mutationGeneric, confectMutationFunction } = makeGenericFunctions(confectSchema);

      // Example of how users would create their own validatedMutation function  
      const createValidatedMutation = <Args, Returns>({
        args,
        returns,
        handler,
        validate,
      }: {
        args: Schema.Schema<Args, any>;
        returns: Schema.Schema<Returns, any>;
        handler: ConfectMutationHandler<any, Args, Returns>;
        validate: (args: Args) => Effect.Effect<void, Error>;
      }) =>
        mutationGeneric(
          confectMutationFunction({
            args,
            returns,
            handler: (a: Args) =>
              Effect.gen(function* () {
                // Run validation first
                yield* validate(a);
                
                // Then run the handler
                return yield* handler(a);
              }),
          }),
        );

      // Test creating a validated mutation
      const createPost = createValidatedMutation({
        args: Schema.Struct({ 
          title: Schema.String,
          content: Schema.String,
        }),
        returns: Schema.Struct({ 
          id: Schema.String,
          title: Schema.String,
        }),
        handler: ({ title, content }) =>
          Effect.succeed({
            id: `post-${title.length}-${content.length}-${Date.now()}`,
            title,
          }),
        validate: ({ title, content }) =>
          Effect.gen(function* () {
            if (title.length < 3) {
              return yield* Effect.fail(new Error("Title too short"));
            }
            if (content.length < 10) {
              return yield* Effect.fail(new Error("Content too short"));
            }
          }),
      });

      // Verify the structure
      expect(createPost).toBeDefined();
      expect(typeof createPost).toBe('function');
    }));

  test("demonstrates practical usage examples", () =>
    Effect.gen(function* () {
      const { queryGeneric, mutationGeneric, confectQueryFunction, confectMutationFunction } = makeGenericFunctions(confectSchema);

      // 1. Role-based access control pattern
      const createAdminOnlyMutation = <Args, Returns>({
        args,
        returns,
        handler,
      }: {
        args: Schema.Schema<Args, any>;
        returns: Schema.Schema<Returns, any>;
        handler: ConfectMutationHandler<any, Args, Returns>;
      }) =>
        mutationGeneric(
          confectMutationFunction({
            args,
            returns,
            handler: (a: Args) =>
              Effect.gen(function* () {
                // In a real app, you'd check user role here
                // const ctx = yield* ConfectMutationCtx();
                // const userIdentity = yield* ctx.auth.getUserIdentity();
                // ... role checking logic ...
                
                return yield* handler(a);
              }),
          }),
        );

      // 2. Resource ownership pattern
      const createOwnerOnlyQuery = <Args, Returns>({
        args,
        returns,
        handler,
        checkOwnership,
      }: {
        args: Schema.Schema<Args, any>;
        returns: Schema.Schema<Returns, any>;
        handler: ConfectQueryHandler<any, Args, Returns>;
        checkOwnership: (args: Args, userId: string) => Effect.Effect<boolean, Error>;
      }) =>
        queryGeneric(
          confectQueryFunction({
            args,
            returns,
            handler: (a: Args) =>
              Effect.gen(function* () {
                // In a real app:
                // const ctx = yield* ConfectQueryCtx();
                // const userIdentity = yield* ctx.auth.getUserIdentity();
                // const userId = userIdentity.value.subject;
                // const ownsResource = yield* checkOwnership(a, userId);
                // if (!ownsResource) throw new Error("Forbidden");
                
                // For demo purposes, just use checkOwnership to avoid linting error
                void checkOwnership;
                return yield* handler(a);
              }),
          }),
        );

      // 3. Rate limiting pattern
      const createRateLimitedMutation = <Args, Returns>({
        args,
        returns,
        handler,
        rateLimitKey,
      }: {
        args: Schema.Schema<Args, any>;
        returns: Schema.Schema<Returns, any>;
        handler: ConfectMutationHandler<any, Args, Returns>;
        rateLimitKey: (args: Args) => string;
      }) =>
        mutationGeneric(
          confectMutationFunction({
            args,
            returns,
            handler: (a: Args) =>
              Effect.gen(function* () {
                // In a real app, you'd check rate limits here
                // const key = rateLimitKey(a);
                // ... rate limiting logic ...
                
                // For demo purposes, just use rateLimitKey to avoid linting error
                void rateLimitKey;
                return yield* handler(a);
              }),
          }),
        );

      // Verify all patterns can be created
      expect(typeof createAdminOnlyMutation).toBe('function');
      expect(typeof createOwnerOnlyQuery).toBe('function');
      expect(typeof createRateLimitedMutation).toBe('function');
    }));
});