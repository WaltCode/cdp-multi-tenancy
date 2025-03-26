import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

interface UserPayload {
  userId: string;
  email: string;
  roles: string[];
  tenantId: string;
}

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  async create(
    @Req() req: Request & { user: UserPayload },
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(req.user.tenantId, createCustomerDto);
  }

  @Get()
  async findAll(@Req() req: Request & { user: UserPayload }) {
    return this.customersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  async update(
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      req.user.tenantId,
      id,
      updateCustomerDto,
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: Request & { user: UserPayload },
    @Param('id') id: string,
  ) {
    return this.customersService.remove(req.user.tenantId, id);
  }
}
