import { PartialType } from '@nestjs/swagger';
import { CreateEmailDto } from './create-email.dto.js';

export class UpdateEmailDto extends PartialType(CreateEmailDto) {}
