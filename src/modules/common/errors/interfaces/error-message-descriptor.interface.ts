export interface ErrorMessageDescriptor {
  code: string;
  messageKey: string;
  message?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
}
