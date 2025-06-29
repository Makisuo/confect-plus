import {
  type DefaultFunctionArgs,
  type GenericActionCtx,
  type GenericMutationCtx,
  type GenericQueryCtx,
  type RegisteredAction,
  type RegisteredMutation,
  type RegisteredQuery,
  actionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";
import { Effect, Option, Schema, pipe } from "effect";

import {
  ConfectActionCtx,
  ConfectMutationCtx,
  ConfectQueryCtx,
  makeConfectActionCtx,
  makeConfectMutationCtx,
  makeConfectQueryCtx,
} from "~/src/server/ctx";
import type {
  DataModelFromConfectDataModel,
  GenericConfectDataModel,
} from "~/src/server/data-model";
import {
  type DatabaseSchemasFromConfectDataModel,
  databaseSchemasFromConfectSchema,
} from "~/src/server/database";
import type {
  ConfectDataModelFromConfectSchema,
  ConfectSchemaDefinition,
  GenericConfectSchema,
} from "~/src/server/schema";
import {
  compileArgsSchema,
  compileReturnsSchema,
} from "~/src/server/schema-to-validator";

// Export types for custom function creation
export type ConfectQueryHandler<
  ConfectDataModel extends GenericConfectDataModel,
  ConfectArgs,
  ConfectReturns,
  E = never,
> = (
  args: ConfectArgs,
) => Effect.Effect<ConfectReturns, E, ConfectQueryCtx<ConfectDataModel>>;

export type ConfectMutationHandler<
  ConfectDataModel extends GenericConfectDataModel,
  ConfectArgs,
  ConfectReturns,
  E = never,
> = (
  args: ConfectArgs,
) => Effect.Effect<ConfectReturns, E, ConfectMutationCtx<ConfectDataModel>>;

export type ConfectActionHandler<
  ConfectDataModel extends GenericConfectDataModel,
  ConfectArgs,
  ConfectReturns,
  E = never,
> = (
  args: ConfectArgs,
) => Effect.Effect<ConfectReturns, E, ConfectActionCtx<ConfectDataModel>>;

export const makeFunctions = <ConfectSchema extends GenericConfectSchema>(
  confectSchemaDefinition: ConfectSchemaDefinition<ConfectSchema>,
) => {
  const databaseSchemas = databaseSchemasFromConfectSchema(
    confectSchemaDefinition.confectSchema,
  );

  const query = <
    ConvexArgs extends DefaultFunctionArgs,
    ConfectArgs,
    ConvexReturns,
    ConfectReturns,
    E,
  >({
    args,
    returns,
    handler,
  }: {
    args: Schema.Schema<ConfectArgs, ConvexArgs>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectArgs,
    ) => Effect.Effect<
      ConfectReturns,
      E,
      ConfectQueryCtx<ConfectDataModelFromConfectSchema<ConfectSchema>>
    >;
  }): RegisteredQuery<"public", ConvexArgs, Promise<ConvexReturns>> =>
    queryGeneric(
      confectQueryFunction({ databaseSchemas, args, returns, handler }),
    );

  const internalQuery = <
    ConvexArgs extends DefaultFunctionArgs,
    ConfectArgs,
    ConvexReturns,
    ConfectReturns,
    E,
  >({
    args,
    handler,
    returns,
  }: {
    args: Schema.Schema<ConfectArgs, ConvexArgs>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectArgs,
    ) => Effect.Effect<
      ConfectReturns,
      E,
      ConfectQueryCtx<ConfectDataModelFromConfectSchema<ConfectSchema>>
    >;
  }): RegisteredQuery<"internal", ConvexArgs, Promise<ConvexReturns>> =>
    internalQueryGeneric(
      confectQueryFunction({ databaseSchemas, args, returns, handler }),
    );

  const mutation = <
    ConvexValue extends DefaultFunctionArgs,
    ConfectValue,
    ConvexReturns,
    ConfectReturns,
    E,
  >({
    args,
    returns,
    handler,
  }: {
    args: Schema.Schema<ConfectValue, ConvexValue>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectValue,
    ) => Effect.Effect<
      ConfectReturns,
      E,
      ConfectMutationCtx<ConfectDataModelFromConfectSchema<ConfectSchema>>
    >;
  }): RegisteredMutation<"public", ConvexValue, Promise<ConvexReturns>> =>
    mutationGeneric(
      confectMutationFunction({ databaseSchemas, args, returns, handler }),
    );

  const internalMutation = <
    ConvexValue extends DefaultFunctionArgs,
    ConfectValue,
    ConvexReturns,
    ConfectReturns,
    E,
  >({
    args,
    returns,
    handler,
  }: {
    args: Schema.Schema<ConfectValue, ConvexValue>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectValue,
    ) => Effect.Effect<
      ConfectReturns,
      E,
      ConfectMutationCtx<ConfectDataModelFromConfectSchema<ConfectSchema>>
    >;
  }): RegisteredMutation<"internal", ConvexValue, Promise<ConvexReturns>> =>
    internalMutationGeneric(
      confectMutationFunction({ databaseSchemas, args, returns, handler }),
    );

  const action = <
    ConvexValue extends DefaultFunctionArgs,
    ConfectValue,
    ConvexReturns,
    ConfectReturns,
    E,
  >({
    args,
    returns,
    handler,
  }: {
    args: Schema.Schema<ConfectValue, ConvexValue>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectValue,
    ) => Effect.Effect<
      ConfectReturns,
      E,
      ConfectActionCtx<ConfectDataModelFromConfectSchema<ConfectSchema>>
    >;
  }): RegisteredAction<"public", ConvexValue, Promise<ConvexReturns>> =>
    actionGeneric(confectActionFunction({ args, returns, handler }));

  const internalAction = <
    ConvexValue extends DefaultFunctionArgs,
    ConfectValue,
    ConvexReturns,
    ConfectReturns,
    E,
  >({
    args,
    returns,
    handler,
  }: {
    args: Schema.Schema<ConfectValue, ConvexValue>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectValue,
    ) => Effect.Effect<
      ConfectReturns,
      E,
      ConfectActionCtx<ConfectDataModelFromConfectSchema<ConfectSchema>>
    >;
  }): RegisteredAction<"internal", ConvexValue, Promise<ConvexReturns>> =>
    internalActionGeneric(confectActionFunction({ args, returns, handler }));

  return {
    query,
    internalQuery,
    mutation,
    internalMutation,
    action,
    internalAction,
  };
};

export const makeGenericFunctions = <
  ConfectSchema extends GenericConfectSchema,
>(
  confectSchemaDefinition: ConfectSchemaDefinition<ConfectSchema>,
) => {
  const databaseSchemas = databaseSchemasFromConfectSchema(
    confectSchemaDefinition.confectSchema,
  );

  type DataModel = ConfectDataModelFromConfectSchema<ConfectSchema>;

  // Type-preserving query builder
  const buildQuery = <
    ConvexArgs extends DefaultFunctionArgs,
    ConfectArgs,
    ConvexReturns,
    ConfectReturns,
    E = never,
  >(params: {
    args: Schema.Schema<ConfectArgs, ConvexArgs>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectArgs,
    ) => Effect.Effect<ConfectReturns, E, ConfectQueryCtx<DataModel>>;
  }) => confectQueryFunction({ ...params, databaseSchemas });

  // Type-preserving mutation builder
  const buildMutation = <
    ConvexArgs extends DefaultFunctionArgs,
    ConfectArgs,
    ConvexReturns,
    ConfectReturns,
    E = never,
  >(params: {
    args: Schema.Schema<ConfectArgs, ConvexArgs>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectArgs,
    ) => Effect.Effect<ConfectReturns, E, ConfectMutationCtx<DataModel>>;
  }) => confectMutationFunction({ ...params, databaseSchemas });

  // Type-preserving action builder
  const buildAction = <
    ConvexArgs extends DefaultFunctionArgs,
    ConfectArgs,
    ConvexReturns,
    ConfectReturns,
    E = never,
  >(params: {
    args: Schema.Schema<ConfectArgs, ConvexArgs>;
    returns: Schema.Schema<ConfectReturns, ConvexReturns>;
    handler: (
      a: ConfectArgs,
    ) => Effect.Effect<ConfectReturns, E, ConfectActionCtx<DataModel>>;
  }) => confectActionFunction(params);

  // Helper to create queries/mutations with required args
  const withRequiredArgs = <RequiredConvexArgs, RequiredConfectArgs>(
    requiredArgs: Schema.Schema<RequiredConfectArgs, RequiredConvexArgs>,
    provideArgs: () => Effect.Effect<RequiredConfectArgs, Error>,
  ) => ({
    query: <
      UserConvexArgs extends DefaultFunctionArgs,
      UserConfectArgs,
      ConvexReturns,
      ConfectReturns,
      E = never,
    >({
      args: userArgs,
      returns,
      handler,
    }: {
      args: Schema.Schema<UserConfectArgs, UserConvexArgs>;
      returns: Schema.Schema<ConfectReturns, ConvexReturns>;
      handler: (
        args: UserConfectArgs & RequiredConfectArgs,
      ) => Effect.Effect<ConfectReturns, E, ConfectQueryCtx<DataModel>>;
    }) => {
      // Merge user args with required args using Schema.extend
      const mergedArgs = Schema.extend(userArgs, requiredArgs);

      return queryGeneric(
        buildQuery({
          args: mergedArgs,
          returns,
          handler: (mergedArgsValue: UserConfectArgs & RequiredConfectArgs) =>
            Effect.gen(function* () {
              // Inject required args
              const requiredArgsValue = yield* provideArgs();
              const combinedArgs = { ...mergedArgsValue, ...requiredArgsValue };
              return yield* handler(combinedArgs);
            }),
        }),
      );
    },

    mutation: <
      UserConvexArgs extends DefaultFunctionArgs,
      UserConfectArgs,
      ConvexReturns,
      ConfectReturns,
      E = never,
    >({
      args: userArgs,
      returns,
      handler,
    }: {
      args: Schema.Schema<UserConfectArgs, UserConvexArgs>;
      returns: Schema.Schema<ConfectReturns, ConvexReturns>;
      handler: (
        args: UserConfectArgs & RequiredConfectArgs,
      ) => Effect.Effect<ConfectReturns, E, ConfectMutationCtx<DataModel>>;
    }) => {
      // Merge user args with required args using Schema.extend
      const mergedArgs = Schema.extend(userArgs, requiredArgs);

      return mutationGeneric(
        buildMutation({
          args: mergedArgs,
          returns,
          handler: (mergedArgsValue: UserConfectArgs & RequiredConfectArgs) =>
            Effect.gen(function* () {
              // Inject required args
              const requiredArgsValue = yield* provideArgs();
              const combinedArgs = { ...mergedArgsValue, ...requiredArgsValue };
              return yield* handler(combinedArgs);
            }),
        }),
      );
    },
  });

  // Create a helper that creates queries/mutations with automatic user injection
  const withCurrentUser = () => {
    return {
      query: <
        UserConvexArgs extends DefaultFunctionArgs,
        UserConfectArgs,
        ConvexReturns,
        ConfectReturns,
        E = never,
      >({
        args: userArgs,
        returns,
        handler,
      }: {
        args: Schema.Schema<UserConfectArgs, UserConvexArgs>;
        returns: Schema.Schema<ConfectReturns, ConvexReturns>;
        handler: (
          args: UserConfectArgs & { currentUserId: string },
        ) => Effect.Effect<ConfectReturns, E, ConfectQueryCtx<DataModel>>;
      }) => {
        const UserIdArgs = Schema.Struct({
          currentUserId: Schema.String,
        });
        const mergedArgs = Schema.extend(userArgs, UserIdArgs);

        return queryGeneric(
          buildQuery({
            args: mergedArgs,
            returns,
            handler: (
              mergedArgsValue: UserConfectArgs & { currentUserId: string },
            ) =>
              Effect.gen(function* () {
                // Get user identity from context
                const ctx = yield* ConfectQueryCtx<DataModel>();
                const userIdentity = yield* ctx.auth.getUserIdentity();
                if (Option.isNone(userIdentity)) {
                  return yield* Effect.fail(
                    new Error("User not authenticated"),
                  );
                }
                const currentUserId = userIdentity.value.subject;
                const combinedArgs = { ...mergedArgsValue, currentUserId };
                return yield* handler(combinedArgs);
              }),
          }),
        );
      },

      mutation: <
        UserConvexArgs extends DefaultFunctionArgs,
        UserConfectArgs,
        ConvexReturns,
        ConfectReturns,
        E = never,
      >({
        args: userArgs,
        returns,
        handler,
      }: {
        args: Schema.Schema<UserConfectArgs, UserConvexArgs>;
        returns: Schema.Schema<ConfectReturns, ConvexReturns>;
        handler: (
          args: UserConfectArgs & { currentUserId: string },
        ) => Effect.Effect<ConfectReturns, E, ConfectMutationCtx<DataModel>>;
      }) => {
        const UserIdArgs = Schema.Struct({
          currentUserId: Schema.String,
        });
        const mergedArgs = Schema.extend(userArgs, UserIdArgs);

        return mutationGeneric(
          buildMutation({
            args: mergedArgs,
            returns,
            handler: (
              mergedArgsValue: UserConfectArgs & { currentUserId: string },
            ) =>
              Effect.gen(function* () {
                // Get user identity from context
                const ctx = yield* ConfectMutationCtx<DataModel>();
                const userIdentity = yield* ctx.auth.getUserIdentity();
                if (Option.isNone(userIdentity)) {
                  return yield* Effect.fail(
                    new Error("User not authenticated"),
                  );
                }
                const currentUserId = userIdentity.value.subject;
                const combinedArgs = { ...mergedArgsValue, currentUserId };
                return yield* handler(combinedArgs);
              }),
          }),
        );
      },
    };
  };

 

  return {
    // Core Convex function builders
    queryGeneric,
    mutationGeneric,
    actionGeneric,
    internalQueryGeneric,
    internalMutationGeneric,
    internalActionGeneric,

    // Type-preserving Confect function builders
    buildQuery,
    buildMutation,
    buildAction,

    // Context service tags for use in custom handlers
    QueryCtx: ConfectQueryCtx<DataModel>,
    MutationCtx: ConfectMutationCtx<DataModel>,
    ActionCtx: ConfectActionCtx<DataModel>,

    // Required args helpers
    withRequiredArgs,
    withCurrentUser,

    // Legacy builders (for backwards compatibility)
    confectQueryFunction: buildQuery,
    confectMutationFunction: buildMutation,
    confectActionFunction: buildAction,
  };
};

const confectQueryFunction = <
  ConfectDataModel extends GenericConfectDataModel,
  ConvexArgs extends DefaultFunctionArgs,
  ConfectArgs,
  ConvexReturns,
  ConfectReturns,
  E,
>({
  databaseSchemas,
  args,
  returns,
  handler,
}: {
  databaseSchemas: DatabaseSchemasFromConfectDataModel<ConfectDataModel>;
  args: Schema.Schema<ConfectArgs, ConvexArgs>;
  returns: Schema.Schema<ConfectReturns, ConvexReturns>;
  handler: (
    a: ConfectArgs,
  ) => Effect.Effect<ConfectReturns, E, ConfectQueryCtx<ConfectDataModel>>;
}) => ({
  args: compileArgsSchema(args),
  returns: compileReturnsSchema(returns),
  handler: (
    ctx: GenericQueryCtx<DataModelFromConfectDataModel<ConfectDataModel>>,
    actualArgs: ConvexArgs,
  ): Promise<ConvexReturns> =>
    pipe(
      actualArgs,
      Schema.decode(args),
      Effect.orDie,
      Effect.andThen((decodedArgs) =>
        handler(decodedArgs).pipe(
          Effect.provideService(
            ConfectQueryCtx<ConfectDataModel>(),
            makeConfectQueryCtx(ctx, databaseSchemas),
          ),
        ),
      ),
      Effect.andThen((convexReturns) =>
        Schema.encodeUnknown(returns)(convexReturns),
      ),
      Effect.runPromise,
    ),
});

const confectMutationFunction = <
  ConfectDataModel extends GenericConfectDataModel,
  ConvexValue extends DefaultFunctionArgs,
  ConfectValue,
  ConvexReturns,
  ConfectReturns,
  E,
>({
  databaseSchemas,
  args,
  returns,
  handler,
}: {
  databaseSchemas: DatabaseSchemasFromConfectDataModel<ConfectDataModel>;
  args: Schema.Schema<ConfectValue, ConvexValue>;
  returns: Schema.Schema<ConfectReturns, ConvexReturns>;
  handler: (
    a: ConfectValue,
  ) => Effect.Effect<ConfectReturns, E, ConfectMutationCtx<ConfectDataModel>>;
}) => ({
  args: compileArgsSchema(args),
  returns: compileReturnsSchema(returns),
  handler: (
    ctx: GenericMutationCtx<DataModelFromConfectDataModel<ConfectDataModel>>,
    actualArgs: ConvexValue,
  ): Promise<ConvexReturns> =>
    pipe(
      actualArgs,
      Schema.decode(args),
      Effect.orDie,
      Effect.andThen((decodedArgs) =>
        handler(decodedArgs).pipe(
          Effect.provideService(
            ConfectMutationCtx<ConfectDataModel>(),
            makeConfectMutationCtx(ctx, databaseSchemas),
          ),
        ),
      ),
      Effect.andThen((convexReturns) =>
        Schema.encodeUnknown(returns)(convexReturns),
      ),
      Effect.runPromise,
    ),
});

const confectActionFunction = <
  ConfectDataModel extends GenericConfectDataModel,
  ConvexValue extends DefaultFunctionArgs,
  ConfectValue,
  ConvexReturns,
  ConfectReturns,
  E,
>({
  args,
  returns,
  handler,
}: {
  args: Schema.Schema<ConfectValue, ConvexValue>;
  returns: Schema.Schema<ConfectReturns, ConvexReturns>;
  handler: (
    a: ConfectValue,
  ) => Effect.Effect<ConfectReturns, E, ConfectActionCtx<ConfectDataModel>>;
}) => ({
  args: compileArgsSchema(args),
  returns: compileReturnsSchema(returns),
  handler: (
    ctx: GenericActionCtx<DataModelFromConfectDataModel<ConfectDataModel>>,
    actualArgs: ConvexValue,
  ): Promise<ConvexReturns> =>
    pipe(
      actualArgs,
      Schema.decode(args),
      Effect.orDie,
      Effect.andThen((decodedArgs) =>
        handler(decodedArgs).pipe(
          Effect.provideService(
            ConfectActionCtx<ConfectDataModel>(),
            makeConfectActionCtx(ctx),
          ),
        ),
      ),
      Effect.andThen((convexReturns) =>
        Schema.encodeUnknown(returns)(convexReturns),
      ),
      Effect.runPromise,
    ),
});
