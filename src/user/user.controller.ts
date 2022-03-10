import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtGuard } from '../auth/guard';
import { GetUser } from './decorator';
import { UpdateUser } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @Get('me')
  getCurrentUser(@GetUser() user: User) {
    return user;
  }

  @Patch('')
  updateUser(@GetUser('id') userId: number, @Body() updatedUser: UpdateUser) {
    return this.userService.updateUser(userId, updatedUser);
  }
}
