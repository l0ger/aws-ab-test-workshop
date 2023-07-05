'use strict';

const sourceCookie = 'X-Source';
const sourceMain = 'main';
const sourceExperiment = 'experiment';
const experimentBucketName = '[your s3 bucket name].s3-website.eu-central-1.amazonaws.com';
const experimentBucketRegion = 'eu-central-1';

// Origin Request handler
export  const handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const source = decideSource(headers);

  // If Source is Experiment, change Origin and Host header
  if ( source === sourceExperiment ) {
    console.log('Setting Origin to experiment bucket');
    // Specify Origin
    // If you S3 bucket endpoint, use origin instead of customOrigin
    request.customOrigin = {
      s3: {
        authMethod: 'none',
        domainName: experimentBucketName,
        path: '',
        protocol:'http',
        region: experimentBucketRegion
      }
    };

    // Also set Host header to prevent “The request signature we calculated does not match the signature you provided” error
    headers['host'] = [{key: 'host', value: experimentBucketName }];
  }
  // No need to change anything if Source was Main or undefined

  callback(null, request);
};


// Decide source based on source cookie.
const decideSource = function(headers) {
  const sourceMainCookie = `${sourceCookie}=${sourceMain}`;
  const sourceExperimenCookie = `${sourceCookie}=${sourceExperiment}`;

  // Remember a single cookie header entry may contain multiple cookies
  if (headers.cookie) {
    // ...ugly but simple enough for now
    for (let i = 0; i < headers.cookie.length; i++) {
      if (headers.cookie[i].value.indexOf(sourceExperimenCookie) >= 0) {
        console.log('Experiment Source cookie found');
        return sourceExperiment;
      }
      if (headers.cookie[i].value.indexOf(sourceMainCookie) >= 0) {
        console.log('Main Source cookie found');
        return sourceMain;
      }
    }
  }
  console.log('No Source cookie found (Origin undecided)');
}
