export type FieldIssue = { code: string; limit?: number | string };
export type FieldErrors = Record<string, FieldIssue>;
export type FormOutcome = { error: string; success: boolean; fieldErrors?: FieldErrors };
