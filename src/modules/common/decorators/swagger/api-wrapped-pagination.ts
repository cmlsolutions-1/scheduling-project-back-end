import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { SuccessResponseDto } from "../../dto/success-response.dto";
import { PaginatedDto } from "../../dto/pagination/paginated.dto";
import { PaginationMetaDto } from "../../dto/pagination/pagination-meta.dto";




export const ApiOkWrappedPaginated = <TModel extends Type<any>>(
  model: TModel,
  description?: string,
) =>
  applyDecorators(
    ApiExtraModels(SuccessResponseDto, PaginatedDto, PaginationMetaDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(PaginatedDto) },
                  {
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) },
                      },
                      pagination: { $ref: getSchemaPath(PaginationMetaDto) },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  );