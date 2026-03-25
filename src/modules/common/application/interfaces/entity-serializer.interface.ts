export interface EntitySerializer<TEntity, TView> {
  serialize(entity: TEntity): TView;
}
