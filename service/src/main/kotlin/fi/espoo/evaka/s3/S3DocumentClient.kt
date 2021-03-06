// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.s3

import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.AmazonS3URI
import com.amazonaws.services.s3.model.ObjectMetadata
import com.amazonaws.services.s3.model.PutObjectRequest
import org.springframework.stereotype.Service
import java.net.URI

@Service("appS3DocumentClient")
class S3DocumentClient(private val s3Client: AmazonS3) : DocumentService {
    override fun get(bucketName: String, key: String): Document {
        val s3object = s3Client.getObject(bucketName, key)
        return DocumentWrapper(
            name = key,
            path = "/",
            bytes = s3object.objectContent.readBytes()
        )
    }

    override fun get(uri: URI): Document = AmazonS3URI(uri)
        .let {
            get(bucketName = it.bucket, key = it.key)
        }

    override fun headObject(bucketName: String, key: String): ObjectMetadata =
        s3Client.getObjectMetadata(bucketName, key)

    override fun upload(bucketName: String, document: Document, contentType: String): DocumentLocation {
        val metadata = ObjectMetadata()
        metadata.contentType = contentType
        val key = document.getName()
        val request = PutObjectRequest(
            bucketName,
            key,
            document.getBytes().inputStream(),
            metadata
        )

        s3Client.putObject(request)
        return DocumentLocation(
            uri = s3Client.getUrl(bucketName, key).toURI()
        )
    }

    override fun delete(bucketName: String, key: String) {
        s3Client.deleteObject(bucketName, key)
    }
}
