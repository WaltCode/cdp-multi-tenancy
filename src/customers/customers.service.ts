import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { RedisClientType } from 'redis';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @Inject('REDIS_CLIENT')
    private redisClient: RedisClientType,
  ) {}

  private getCacheKey(tenantId: string, customerId?: string): string {
    return customerId
      ? `customer:${tenantId}:${customerId}`
      : `customers:${tenantId}`;
  }

  async create(tenantId: string, createCustomerDto: CreateCustomerDto) {
    const customer = this.customersRepository.create({
      ...createCustomerDto,
      tenantId,
    });
    const savedCustomer = await this.customersRepository.save(customer);
    await this.redisClient.del(this.getCacheKey(tenantId));
    return savedCustomer;
  }

  async findAll(tenantId: string) {
    const cacheKey = this.getCacheKey(tenantId);
    const cachedData = await this.redisClient.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    const customers = await this.customersRepository.find({
      where: { tenantId },
    });
    await this.redisClient.set(cacheKey, JSON.stringify(customers), {
      EX: 3600,
    });
    return customers;
  }

  async findOne(tenantId: string, id: string) {
    const cacheKey = this.getCacheKey(tenantId, id);
    const cachedData = await this.redisClient.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    const customer = await this.customersRepository.findOne({
      where: { id, tenantId },
    });
    if (customer) {
      await this.redisClient.set(cacheKey, JSON.stringify(customer), {
        EX: 1800,
      });
    }
    return customer;
  }

  async update(
    tenantId: string,
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    await this.customersRepository.update({ id, tenantId }, updateCustomerDto);
    await this.redisClient.del(this.getCacheKey(tenantId, id));
    await this.redisClient.del(this.getCacheKey(tenantId));
    return this.customersRepository.findOne({ where: { id, tenantId } });
  }

  async remove(tenantId: string, id: string) {
    await this.redisClient.del(this.getCacheKey(tenantId, id));
    await this.redisClient.del(this.getCacheKey(tenantId));
    return this.customersRepository.delete({ id, tenantId });
  }
}
