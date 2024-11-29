import { Request } from "express";

export type RequestWithParams<P> = Request<P, never, never>;
export type RequestWithBody<B> = Request<never, never, B>;
export type RequestWithQuery<Q> = Request<never, never, never, Q>;

export type PaginationParamsType = {
  page?: number;
  pageSize: number;
};
