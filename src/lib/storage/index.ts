import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

export const storage = {
  async putObject(input: {
    key: string;
    body: Uint8Array;
    contentType: string;
    contentLength: number;
  }) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
      }),
    );
  },

  async getObject(input: { key: string }) {
    return s3Client.send(
      new GetObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: input.key,
      }),
    );
  },

  async deleteObject(input: { key: string }) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: input.key,
      }),
    );
  },
};
