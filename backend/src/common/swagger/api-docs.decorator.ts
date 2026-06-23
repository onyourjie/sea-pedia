import { HttpStatus, applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

type ApiEndpointOptions = {
  summary: string;
  description?: string;
  successDescription?: string;
  status?: number;
  auth?: boolean;
  roles?: string[];
  notFound?: boolean;
  responseExample?: unknown;
};

const errorSchema = (statusCode: number, error: string, message: string) => ({
  example: {
    statusCode,
    error,
    message,
    timestamp: '2026-06-23T10:00:00.000Z',
    path: '/api/example',
  },
});

export function ApiEndpoint(options: ApiEndpointOptions) {
  const {
    summary,
    description,
    successDescription = 'Request berhasil diproses.',
    status = HttpStatus.OK,
    auth = false,
    roles = [],
    notFound = false,
    responseExample,
  } = options;

  const accessDescription =
    roles.length > 0
      ? ` Akses: ${roles.join(', ')}.`
      : auth
        ? ' Memerlukan autentikasi.'
        : ' Endpoint publik.';

  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [
    ApiOperation({
      summary,
      description: `${description ?? successDescription}${accessDescription}`,
    }),
    ApiResponse({
      status,
      description: successDescription,
      ...(responseExample === undefined
        ? {}
        : { schema: { example: responseExample } }),
    }),
    ApiBadRequestResponse({
      description: 'Request tidak valid.',
      schema: errorSchema(400, 'Bad Request', 'Validation failed'),
    }),
  ];

  if (auth) {
    decorators.push(
      ApiBearerAuth(),
      ApiUnauthorizedResponse({
        description: 'Token tidak ada, tidak valid, atau sudah kedaluwarsa.',
        schema: errorSchema(401, 'Unauthorized', 'Unauthorized'),
      }),
    );
  }

  if (roles.length > 0) {
    decorators.push(
      ApiForbiddenResponse({
        description: `Role yang diizinkan: ${roles.join(', ')}.`,
        schema: errorSchema(403, 'Forbidden', 'Insufficient role'),
      }),
    );
  }

  if (notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: 'Data yang diminta tidak ditemukan.',
        schema: errorSchema(404, 'Not Found', 'Resource not found'),
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function ApiPagination(defaultLimit = 20) {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      minimum: 1,
      example: 1,
      description: 'Nomor halaman.',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      minimum: 1,
      maximum: 100,
      example: defaultLimit,
      description: 'Jumlah data per halaman.',
    }),
  );
}

export function ApiLimit(defaultLimit = 10) {
  return ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    example: defaultLimit,
    description: 'Jumlah maksimum data.',
  });
}

export function ApiIdParam(
  name: string,
  description: string,
  example = 'clx1234567890',
) {
  return ApiParam({
    name,
    type: String,
    required: true,
    description,
    example,
  });
}

export function ApiWebhookTokenHeader() {
  return ApiHeader({
    name: 'x-callback-token',
    required: true,
    description: 'Token verifikasi callback yang dikirim oleh Xendit.',
  });
}
