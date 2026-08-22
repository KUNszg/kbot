/**
 * Returns a human-readable description of a custom HTTP status code.
 *
 * @param {string|number} code - The HTTP status code to describe.
 * @returns {string} A string describing the HTTP status code.
 */
const customHttpStatus = code => {
  switch (String(code)) {
    // 1xx informational response
    case '100':
      return (
        '[info resp 100 Continue] - the server has received the request headers ' +
        'and the client should proceed to send the request body (POST request).'
      );

    case '101':
      return (
        '[info resp 101 Switching Protocols] - the requester has asked the server ' +
        'to switch protocols and the server has agreed to do so.'
      );

    case '102':
      return (
        '[info resp 102 Processing] - a WebDAV request may contain many sub-requests ' +
        'involving file operations, requiring a long time to complete the request.'
      );

    case '103':
      return '[info resp 103 Early Hints] - returning response headers before final HTTP message.';

    // 2xx success
    case '200':
      return '[success 200 OK] - successful HTTP response.';

    case '201':
      return '[success 200 Created] - the request has been fulfilled, resulting in the creation of a new resource.';

    case '202':
      return '[success 202 Accepted] - the request has been accepted for processing, but the processing has not been completed. ';

    case '203':
      return "[success 203 Non-Authoritative Information] - returning midified version of the origin's response.";

    case '204':
      return '[success 204 No Content] - the server successfully processed the request, and is not returning any content.';

    case '205':
      return (
        '[success 205 Reset Content] - the server successfully processed the request, asks that the requester ' +
        'reset its document view, and is not returning any content.'
      );

    case '206':
      return (
        '[success 206 Partial Content] - the server is delivering only part of the resource (byte serving) ' +
        'due to a range header sent by the client. '
      );

    case '207':
      return (
        '[success 207 Multi-Status] - the message body that follows is by default an XML message and can ' +
        'contain a number of separate response codes.'
      );

    case '208':
      return (
        '[success 208 Already Reported] - the members of a DAV binding have already been enumerated in a preceding ' +
        'part of the (multistatus) response, and are not being included again.'
      );

    case '226':
      return (
        '[success 226 IM Used] - the server has fulfilled a request for the resource, and the response is a ' +
        'representation of the result of one or more instance-manipulations applied to the current instance.'
      );

    // 3xx redirection
    case '300':
      return '[redirection 300 Multiple Choices] - indicates multiple options for the resource from which the client may choose';

    case '301':
      return '[redirection 301 Moved Permanently] - this and all future requests should be directed to the given URI.';

    case '302':
      return '[redirection 302 Found] - look at (browse to) another URL.';

    case '303':
      return '[redirection 303 See Other] - the response to the request can be found under another URI using the GET method.';

    case '304':
      return (
        '[redirection 304 Not Modified] - resource has not been modified since the version specified by the ' +
        'request headers If-Modified-Since or If-None-Match'
      );

    case '305':
      return '[redirection 305 Use Proxy] - the requested resource is available only through a proxy.';

    case '307':
      return (
        '[redirection 307 Temporary Redirect] - the request should be repeated with another URI; ' +
        ' however, future requests should still use the original URI'
      );

    case '308':
      return '[redirection 308 Permanent Redirect] - the request and all future requests should be repeated using another URI.';

    // 4xx client errors
    case '400':
      return '[client err 400 Bad Request] - the server could not understand the request due to invalid syntax.';

    case '401':
      return '[client err 401 Unauthorized] - I am not authorized to resolve this request.';

    case '403':
      return '[client err 403 Forbidden] - the server understood the request, but is refusing to fulfill it.';

    case '404':
      return '[client err 404 Not Found] - requested resource could not be found.';

    case '405':
      return '[client err 405 Method Not Allowed] - a request method is not supported for the requested resource.';

    case '406':
      return (
        '[client err 406 Not Acceptable] - the requested resource is capable of generating only content ' +
        'not acceptable according to the Accept headers sent in the request.'
      );

    case '407':
      return '[client err 407 Proxy Authentication Required] - The client must first authenticate itself with the proxy.';

    case '408':
      return '[client err 408 Request Timeout] - the server timed out waiting for the request.';

    case '409':
      return '[client err 409 Conflict] - request could not be processed because of conflict in the current state of the resource';

    case '410':
      return '[client err 410 Gone] - resource requested is no longer available and will not be available again';

    case '411':
      return (
        '[client err 411 Length Required] - the request did not specify the length of its content, ' +
        'which is required by the requested resource.'
      );

    case '412':
      return (
        '[client err 412 Precondition Failed] - the server does not meet one of the preconditions that ' +
        'the requester put on the request header fields.'
      );

    case '413':
      return '[client err 413 Payload Too Large] - the request is larger than the server is willing or able to process.';

    case '414':
      return '[client err 414 URI Too Long] - the URI provided was too long for the server to process.';

    case '415':
      return (
        '[client err 415 Unsupported Media Type] - the request entity has a media type which the ' +
        'server or resource does not support. '
      );

    case '416':
      return (
        '[client err 416 Range Not Satisfable] - The client has asked for a portion of the ' +
        'file (byte serving), but the server cannot supply that portion.'
      );

    case '417':
      return '[client err 417 Expectation Failed] - the server cannot meet the requirements of the Expect request-header field.';

    case '418':
      return "[client err 418 I'm a teapot] - Okayga 🍵";

    case '421':
      return '[client err 421 Misdirected Request] - the request was directed at a server that is not able to produce a response.';

    case '422':
      return '[client err 422 Unprocessable Entity] - the request was well-formed but was unable to be followed due to semantic errors.';

    case '423':
      return '[client err 423 Locked] - the resource that is being accessed is locked.';

    case '424':
      return '[client err 424 Failed Dependency] - the request failed because it depended on another request and that request failed.';

    case '425':
      return '[client err 425 Too Early] - the server is unwilling to risk processing a request that might be replayed.';

    case '426':
      return (
        '[client err 426 Upgrade Required] - the client should switch to a different protocol such as TLS/1.3, ' +
        'given in the Upgrade header field.'
      );

    case '428':
      return '[client err 428 Precondition Required] - the origin server requires the request to be conditional. ';

    case '429':
      return '[client err 429 Too Many Requests] - sending too many queries at once, rate limiting has been applied.';

    case '431':
      return (
        '[client err 431 Request Header Fields Too Large] - the server is unwilling to process the request because either ' +
        'an individual header field, or all the header fields collectively, are too large.'
      );

    case '444':
      return '[nginx client err 444 No Response] - server will return no information to client';

    case '451':
      return (
        '[client err 451 Unavailable For Legal Reasons] - A server operator has received a legal demand to deny access ' +
        'to a resource or to a set of resources that includes the requested resource.'
      );

    case '494':
      return '[nginx client err 494 Request header too large] - too large request or too long header line.';

    case '495':
      return '[nginx client err 495 SSL Certificate Error] - the client has provided an invalid client certificate.';

    case '496':
      return '[nginx client err 496 SSL Certificate Required] - client certificate is required but not provided.';

    case '497':
      return (
        '[nginx client err 497 HTTP Request Sent to HTTPS Port] - the client has made a HTTP request to a port ' +
        'listening for HTTPS requests.'
      );

    case '499':
      return '[nginx client err 499 Client Closed Request] - the client has closed the request before the server could send a response.';

    // 5xx server errors
    case '500':
      return '[server err 500 Internal Server Error]';

    case '501':
      return (
        '[server err 501 Not implemented] - the server either does not recognize the request method, or ' +
        'it lacks the ability to fulfil the request.'
      );

    case '502':
      return (
        '[server err 502 Bad Gateway] - the server was acting as a gateway or proxy and received an invalid ' +
        'response from the upstream server.'
      );

    case '503':
      return '[server err 503 Service Unavailable] - the server is currently unable to handle the request due to a temporary condition.';

    case '504':
      return '[server err 504 Gateway Timeout] - the server cannot handle the request due to overload/maintenance.';

    case '505':
      return '[server err 505 HTTP Version Not Supported] - the server does not support the HTTP protocol version used in the request.';

    case '506':
      return '[server err 506 Variant Also Negotiates] - transparent content negotiation for the request results in a circular reference.';

    case '507':
      return '[server err 507 Insufficient Storage] - the server is unable to store the representation needed to complete the request.';

    case '508':
      return '[server err 508 Loop Detected] - the server detected an infinite loop while processing the request';

    case '510':
      return '[server err 510 Not Exteneded] - further extensions to the request are required for the server to fulfil it.';

    case '511':
      return '[server err 511 Network Authentication Required] - the client needs to authenticate to gain network access.';

    default:
      return `unexpected error status`;
  }
};

module.exports = customHttpStatus;
