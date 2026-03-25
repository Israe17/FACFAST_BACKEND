export interface QueryUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
