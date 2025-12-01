import { Test, TestingModule } from '@nestjs/testing';
import { GiftpacksService } from './giftpacks.service';

describe('GiftpacksService', () => {
  let service: GiftpacksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GiftpacksService],
    }).compile();

    service = module.get<GiftpacksService>(GiftpacksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
