import type {
  Expand,
  FunctionReference,
  FunctionReturnType,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  NamedTableInfo,
  OptionalRestArgs,
  VectorIndexNames,
  VectorSearchQuery,
} from "convex/server";
import type { GenericId } from "convex/values";
import { Context, Effect } from "effect";

import { type ConfectAuth, ConfectAuthImpl } from "~/src/server/auth";
import type {
  DataModelFromConfectDataModel,
  GenericConfectDataModel,
  TableNamesInConfectDataModel,
} from "~/src/server/data-model";
import {
  type ConfectDatabaseReader,
  ConfectDatabaseReaderImpl,
  type ConfectDatabaseWriter,
  ConfectDatabaseWriterImpl,
  type DatabaseSchemasFromConfectDataModel,
} from "~/src/server/database";
import {
  type ConfectScheduler,
  ConfectSchedulerImpl,
} from "~/src/server/scheduler";
import {
  type ConfectStorageReader,
  ConfectStorageReaderImpl,
  type ConfectStorageWriter,
  ConfectStorageWriterImpl,
} from "~/src/server/storage";

export type ConfectMutationCtx<
  ConfectDataModel extends GenericConfectDataModel,
> = {
  db: ConfectDatabaseWriter<ConfectDataModel>;
  auth: ConfectAuth;
  storage: ConfectStorageWriter;
  scheduler: ConfectScheduler;
  runQuery<Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Effect.Effect<FunctionReturnType<Query>>;
  runMutation<
    Mutation extends FunctionReference<"mutation", "public" | "internal">,
  >(
    mutation: Mutation,
    ...args: OptionalRestArgs<Mutation>
  ): Effect.Effect<FunctionReturnType<Mutation>>;
};

export const ConfectMutationCtx = <
  ConfectDataModel extends GenericConfectDataModel,
>() =>
  Context.GenericTag<ConfectMutationCtx<ConfectDataModel>>(
    "confect-plus/ConfectMutationCtx",
  );

export type ConfectQueryCtx<ConfectDataModel extends GenericConfectDataModel> =
  {
    db: ConfectDatabaseReader<ConfectDataModel>;
    auth: ConfectAuth;
    storage: ConfectStorageReader;
    runQuery<Query extends FunctionReference<"query", "public" | "internal">>(
      query: Query,
      ...args: OptionalRestArgs<Query>
    ): Effect.Effect<FunctionReturnType<Query>>;
  };

export const ConfectQueryCtx = <
  ConfectDataModel extends GenericConfectDataModel,
>() =>
  Context.GenericTag<ConfectQueryCtx<ConfectDataModel>>(
    "confect-plus/ConfectQueryCtx",
  );

export type ConfectActionCtx<ConfectDataModel extends GenericConfectDataModel> =
  {
    runQuery<Query extends FunctionReference<"query", "public" | "internal">>(
      query: Query,
      ...args: OptionalRestArgs<Query>
    ): Effect.Effect<FunctionReturnType<Query>>;
    runMutation<
      Mutation extends FunctionReference<"mutation", "public" | "internal">,
    >(
      mutation: Mutation,
      ...args: OptionalRestArgs<Mutation>
    ): Effect.Effect<FunctionReturnType<Mutation>>;
    runAction<
      Action extends FunctionReference<"action", "public" | "internal">,
    >(
      action: Action,
      ...args: OptionalRestArgs<Action>
    ): Effect.Effect<FunctionReturnType<Action>>;
    scheduler: ConfectScheduler;
    auth: ConfectAuth;
    storage: ConfectStorageWriter;
    vectorSearch<
      TableName extends TableNamesInConfectDataModel<ConfectDataModel>,
      IndexName extends VectorIndexNames<
        NamedTableInfo<
          DataModelFromConfectDataModel<ConfectDataModel>,
          TableName
        >
      >,
    >(
      tableName: TableName,
      indexName: IndexName,
      query: Expand<
        VectorSearchQuery<
          NamedTableInfo<
            DataModelFromConfectDataModel<ConfectDataModel>,
            TableName
          >,
          IndexName
        >
      >,
    ): Effect.Effect<Array<{ _id: GenericId<TableName>; _score: number }>>;
  };

export const ConfectActionCtx = <
  ConfectDataModel extends GenericConfectDataModel,
>() =>
  Context.GenericTag<ConfectActionCtx<ConfectDataModel>>(
    "confect-plus/ConfectActionCtx",
  );

export const makeConfectQueryCtx = <
  ConfectDataModel extends GenericConfectDataModel,
>(
  ctx: GenericQueryCtx<DataModelFromConfectDataModel<ConfectDataModel>>,
  databaseSchemas: DatabaseSchemasFromConfectDataModel<ConfectDataModel>,
): ConfectQueryCtx<ConfectDataModel> => ({
  db: new ConfectDatabaseReaderImpl(ctx.db, databaseSchemas),
  auth: new ConfectAuthImpl(ctx.auth),
  storage: new ConfectStorageReaderImpl(ctx.storage),
  runQuery: <Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...queryArgs: OptionalRestArgs<Query>
  ) => Effect.promise(() => ctx.runQuery(query, ...queryArgs)),
});

export const makeConfectMutationCtx = <
  ConfectDataModel extends GenericConfectDataModel,
>(
  ctx: GenericMutationCtx<DataModelFromConfectDataModel<ConfectDataModel>>,
  databaseSchemas: DatabaseSchemasFromConfectDataModel<ConfectDataModel>,
): ConfectMutationCtx<ConfectDataModel> => ({
  db: new ConfectDatabaseWriterImpl(ctx.db, databaseSchemas),
  auth: new ConfectAuthImpl(ctx.auth),
  storage: new ConfectStorageWriterImpl(ctx.storage),
  scheduler: new ConfectSchedulerImpl(ctx.scheduler),
  runQuery: <Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...queryArgs: OptionalRestArgs<Query>
  ) => Effect.promise(() => ctx.runQuery(query, ...queryArgs)),
  runMutation: <
    Mutation extends FunctionReference<"mutation", "public" | "internal">,
  >(
    mutation: Mutation,
    ...mutationArgs: OptionalRestArgs<Mutation>
  ) => Effect.promise(() => ctx.runMutation(mutation, ...mutationArgs)),
});

export const makeConfectActionCtx = <
  ConfectDataModel extends GenericConfectDataModel,
>(
  ctx: GenericActionCtx<DataModelFromConfectDataModel<ConfectDataModel>>,
): ConfectActionCtx<ConfectDataModel> => ({
  runQuery: <Query extends FunctionReference<"query", "public" | "internal">>(
    query: Query,
    ...queryArgs: OptionalRestArgs<Query>
  ) => Effect.promise(() => ctx.runQuery(query, ...queryArgs)),
  runMutation: <
    Mutation extends FunctionReference<"mutation", "public" | "internal">,
  >(
    mutation: Mutation,
    ...mutationArgs: OptionalRestArgs<Mutation>
  ) => Effect.promise(() => ctx.runMutation(mutation, ...mutationArgs)),
  runAction: <
    Action extends FunctionReference<"action", "public" | "internal">,
  >(
    action: Action,
    ...actionArgs: OptionalRestArgs<Action>
  ) => Effect.promise(() => ctx.runAction(action, ...actionArgs)),
  vectorSearch: <
    TableName extends TableNamesInConfectDataModel<ConfectDataModel>,
    IndexName extends VectorIndexNames<
      NamedTableInfo<DataModelFromConfectDataModel<ConfectDataModel>, TableName>
    >,
  >(
    tableName: TableName,
    indexName: IndexName,
    query: Expand<
      VectorSearchQuery<
        NamedTableInfo<
          DataModelFromConfectDataModel<ConfectDataModel>,
          TableName
        >,
        IndexName
      >
    >,
  ) => Effect.promise(() => ctx.vectorSearch(tableName, indexName, query)),
  auth: new ConfectAuthImpl(ctx.auth),
  storage: new ConfectStorageWriterImpl(ctx.storage),
  scheduler: new ConfectSchedulerImpl(ctx.scheduler),
});
