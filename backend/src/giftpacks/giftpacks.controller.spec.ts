import { Test, TestingModule } from '@nestjs/testing';
import { GiftpacksController } from './giftpacks.controller';

describe('GiftpacksController', () => {
  let controller: GiftpacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GiftpacksController],
    }).compile();

    controller = module.get<GiftpacksController>(GiftpacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
