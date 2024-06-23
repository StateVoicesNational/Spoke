/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

import { getConfig, hasConfig, getFeatures } from "../../../server/api/lib/config";
import { r } from "../../../server/models";

export const name = "image-upload";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Image Uploader",
  description:
    "Image uploader for sending images with Spoke (backed by AWS S3)",
  canSpendMoney: false,
  environmentVariables: [
    // ACCESS: This assumes environment variables for an AWS user
    //   that has full-ish access to the s3 bucket
    //   That can be AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    //   but if Spoke is run on AWS Lambda or EC2, it could be through IAM perms
    //   FUTURE: We could allow org-config of these secrets (or at least retrieval
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
    "AWS_REGION"
  ],
  moneySpendingOperations: [],
  supportsOrgConfig: false,
  supportsCampaignConfig: true
});


const cacheKey = id => `${process.env.CACHE_PREFIX || ""}imageupload-${id}`;

const clearFileList = async (organization) => {
  if (r.redis) {
    await r.redis.DEL(cacheKey(organization.id));
  }
}

const getFileList = async (organization) => {
  const region = getConfig("AWS_REGION", organization);
  const bucket = (
    getConfig("IMAGE_UPLOAD_S3_BUCKET_NAME", organization)
      || getConfig("AWS_S3_BUCKET_NAME", organization));
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
  const s3 = new S3({
    // The key signatureVersion is no longer supported in v3, and can be removed.
    // @deprecated SDK v3 only supports signature v4.
    signatureVersion: "v4",
    region
  });

  let fileList;
  const orgKey = cacheKey(organization.id);
  if (r.redis) {
    const cachedData = await r.redis.get(orgKey);
    if (cachedData) {
      fileList = JSON.parse(cachedData);
    }
  }
  if (!fileList) {
    const dirList = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: `image-upload/${organization.id}/`,
    });
    // TODO: iterate paginated results
    fileList = dirList['Contents'].map(o => o.Key);
    if (r.redis) {
      await r.redis
        .MULTI()
        .SET(orgKey, JSON.stringify(fileList))
        .EXPIRE(orgKey, 28800) // 8 hours
        .exec();
    }
  }
  return { s3, region, bucket, baseUrl, fileList };
}

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // MUST NOT RETURN SECRETS!
  // called both from edit and stats contexts: editMode==true for edit page

  const { region, baseUrl, fileList } = await getFileList(organization);

  if (!fromCampaignStatsPage) {
    return {
      data: {
        baseUrl,
        fileList
      },
      // expiresSeconds: 0,  -- not implemented, but could be if it were per-user
      fullyConfigured: true
    };
  }
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData,
  fromCampaignStatsPage
}) {
  // ACCESS: This assumes environment variables for an AWS user
  //   that has full-ish access to the s3 bucket
  //   That can be AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  //   but if Spoke is run on AWS Lambda or EC2, it could be through IAM perms
  //   FUTURE: We could allow org-config of these secrets (or at least retrieval
  console.log('image upload CampaignSignal', updateData);
  
  if (updateData && updateData.fileType && updateData.fileName && /^image\//.test(updateData.fileType)) {
    console.log("uploading a file!!!");
    const { s3, region, bucket, baseUrl, fileList } = await getFileList(organization);
    const unique_key = uuid();
    const s3key = `image-upload/${organization.id}/${unique_key}_${updateData.fileName}`;

    const params = {
      Bucket: bucket,
      Key: s3key,
      ContentType: updateData.fileType,
      //Expires: 5400,  // 1.5 hours (enforced below)
      ACL:'public-read'  // DANGER
    };

    const putCommand = new PutObjectCommand(params);
    // TODO: Cache for org-user
    const s3Url = await await getSignedUrl(s3, putCommand, {
      signableHeaders: new Set(["content-type"]),
      expiresIn: 5400
    });
    await clearFileList(organization);
    return {
      data: {
        baseUrl,
        fileList,
        s3Url,
        s3key,
        fileType: updateData.fileType
      },
      fullyConfigured: true,
      unArchiveable: false
    };

  }
  return {
    data: {},
    fullyConfigured: true,
    unArchiveable: false
  };
}

