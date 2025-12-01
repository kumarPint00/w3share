import { applyDecorators } from '@nestjs/common';
import { ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';

export const JwtAuthDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Invalid or missing JWT' }),
  );
