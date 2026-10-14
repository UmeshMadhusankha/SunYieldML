// CloudFront Function, viewer-request. Attach only to the S3 default behavior.
function handler(event) {
  var request=event.request;
  if(request.uri.indexOf('.')===-1)request.uri='/index.html';
  return request;
}
