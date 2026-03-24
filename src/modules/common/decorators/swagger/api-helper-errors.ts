import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../dto/error-response.dto';



export const ApiCommonErrors = () =>
  applyDecorators(
    ApiBadRequestResponse({ description: 'Datos inválidos', type: ErrorResponseDto }),
    ApiUnauthorizedResponse({ description: 'No autorizado', type: ErrorResponseDto }),
    ApiForbiddenResponse({ description: 'Sin permisos', type: ErrorResponseDto }),
    ApiNotFoundResponse({ description: 'No encontrado', type: ErrorResponseDto }),
    ApiInternalServerErrorResponse({ description: 'Error interno del servidor', type: ErrorResponseDto }),
  );