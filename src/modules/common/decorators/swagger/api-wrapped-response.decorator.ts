
import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiCreatedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { SuccessResponseDto } from '../../dto/success-response.dto';


export const ApiOkWrapped = <TModel extends Type<any>>(model: TModel, description?: string) =>
  applyDecorators(
    ApiExtraModels(SuccessResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

export const ApiOkWrappedArray = <TModel extends Type<any>>(model: TModel, description?: string) =>
  applyDecorators(
    ApiExtraModels(SuccessResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );

export const ApiCreatedWrapped = <TModel extends Type<any>>(model: TModel, description?: string) =>
  applyDecorators(
    ApiExtraModels(SuccessResponseDto, model),
    ApiCreatedResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );