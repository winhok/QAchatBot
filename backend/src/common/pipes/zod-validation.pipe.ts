import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'
import { z } from 'zod'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}
  transform(value: any) {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: z.flattenError(result.error).fieldErrors,
      })
    }
    return result.data
  }
}
