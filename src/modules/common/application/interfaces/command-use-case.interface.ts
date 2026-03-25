export interface CommandUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
