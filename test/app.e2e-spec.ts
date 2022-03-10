import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { UpdateUser } from 'src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto/create-bookmark.dto';
import { UpdateBookmarkDto } from 'src/bookmark/dto/update-bookmark.dto';

describe('App e2e', () => {
  let testApp: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    testApp = moduleRef.createNestApplication();
    testApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await testApp.init();
    await testApp.listen(3333);

    prisma = testApp.get(PrismaService);
    await prisma.cleanDatabase();

    pactum.request.setBaseUrl('http://localhost:3333/');
  });

  afterAll(async () => {
    testApp.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@gmail.com',
      password: '1234',
    };
    describe('Signup', () => {
      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should Signup', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED);
      });
      it('Should throw error if user already exists', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody(dto)
          .expectStatus(HttpStatus.FORBIDDEN);
      });
    });
    describe('Signin', () => {
      it('Should throw error if email is empty', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should throw error if password is empty', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should Signin', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .withBody(dto)
          .expectStatus(HttpStatus.OK)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get current user', () => {
      it('Should return unaithorized when no token is provided', () => {
        return pactum
          .spec()
          .get('users/me')
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
      it('Should return current user', () => {
        return pactum
          .spec()
          .get('users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Edit User', () => {
      it('Should update User', () => {
        const dto: UpdateUser = {
          first_name: 'Robin',
          last_name: 'Paspuel',
        };
        return pactum
          .spec()
          .patch('users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Shold return empty bookmarks', () => {
        return pactum
          .spec()
          .get('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains({
            message: 'No bookmarks yet, create one!',
          });
      });
    });
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'Test Bookmark',
        description: 'This is just a test',
        link: 'http://example.com.',
      };
      it('Should return BAD_REQUEST when no body is provided', () => {
        return pactum
          .spec()
          .post('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.BAD_REQUEST);
      });
      it('Should create a new bookmarks', () => {
        return pactum
          .spec()
          .post('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.CREATED)
          .stores('bookmarkId', 'id');
      });
      it('Should create a new bookmarks without description', () => {
        return pactum
          .spec()
          .post('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody({
            title: dto.title,
            link: dto.link,
          })
          .expectStatus(HttpStatus.CREATED);
      });
    });
    describe('Get bookmarks', () => {
      it('Should return an arary of bookmarks', () => {
        return pactum
          .spec()
          .get('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(2);
      });
    });
    describe('Get bookmark by Id', () => {
      it('Should return a bookmark', () => {
        return pactum
          .spec()
          .get('bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.OK);
      });
      it('Should return an error when no bookmark is found', () => {
        return pactum
          .spec()
          .get('bookmarks/{id}')
          .withPathParams('id', '0')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.NOT_FOUND);
      });
    });
    describe('Edit bookmark by Id', () => {
      const dto: UpdateBookmarkDto = {
        title: 'Updated Title',
        description: 'Updated description',
        link: 'https://bookupdated',
      };
      it('Should return error if bookmark is not found or is not owned', () => {
        return pactum
          .spec()
          .patch('bookmarks/{id}')
          .withPathParams('id', '0')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
      it('Should return same bookmark if body is not given', () => {
        return pactum
          .spec()
          .patch('bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.OK);
      });
      it('Should update bookmark', () => {
        return pactum
          .spec()
          .patch('bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(HttpStatus.OK);
      });
    });
    describe('Delete bookmark by Id', () => {
      it('Should return error if bookmark is not found or is not owned', () => {
        return pactum
          .spec()
          .delete('bookmarks/{id}')
          .withPathParams('id', '0')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.UNAUTHORIZED);
      });
      it('It should delete bookmark', () => {
        return pactum
          .spec()
          .delete('bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(HttpStatus.NO_CONTENT);
      });
    });
  });
});
