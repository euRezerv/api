export type StandardErrorType = {
  message: string;
  stack?: string;
  field?: string;
  fieldType?: string;
  value?: string;
};

export type StandardResponseType<R extends { [key: string]: any }> = {
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  data?: R;
  errors?: StandardErrorType[];
  timestamp: string;
};

export type PaginationResponseType = {
  pagination: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
};
