export interface ApiFailureBody {
  success: false;
  error: string;
}

/** Log internally; return a client-safe JSON body (no stack / driver messages). */
export function apiInternalError(label: string, error: unknown): ApiFailureBody {
  console.error(label, error);
  return { success: false, error: label };
}
