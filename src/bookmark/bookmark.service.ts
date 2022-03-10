import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Bookmark } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        user_id: userId,
        ...dto,
      },
    });
    return bookmark;
  }

  async getBookmark(userId: number) {
    const bookmarks: Bookmark[] = await this.prisma.bookmark.findMany({
      where: { user_id: userId },
    });
    if (bookmarks.length === 0) {
      return { message: 'No bookmarks yet, create one!' };
    }
    return bookmarks;
  }

  async getBookmarkById(UserId: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        user_id: UserId,
      },
    });
    if (!bookmark) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Bookmark not found!',
        },
        HttpStatus.NOT_FOUND,
      );
    }
    return bookmark;
  }

  async updateBookmarkById(
    userId: number,
    bookmarkId: number,
    dto: UpdateBookmarkDto,
  ) {
    const oldBookmark = await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        user_id: userId,
      },
    });
    if (!oldBookmark || oldBookmark.user_id !== userId) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Bookmark not owned by user',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmarkById(userId: number, bookmarkId: number) {
    const oldBookmark = await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        user_id: userId,
      },
    });
    if (!oldBookmark || oldBookmark.user_id !== userId) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Bookmark not found or not owned',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
      },
    });
  }
}
