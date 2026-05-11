import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { GoogleOauthService } from './google-oauth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, GoogleOauthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
