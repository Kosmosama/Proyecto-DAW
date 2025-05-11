import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: '*', // #TODO Change to domain in production
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type, Authorization',
    });

    app.useGlobalInterceptors(new ResponseInterceptor());

    const config = new DocumentBuilder()
        .setTitle('Pokemon ShowDAW API')
        .setDescription('API documentation for the DAW final project.')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('', app, document);

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
