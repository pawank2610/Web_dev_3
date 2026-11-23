const parseUserAgent = (uaString = '') => {
  const ua = uaString.toLowerCase();

  let deviceType = 'Desktop';
  if (/ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/bot|crawler|spider|curl|wget|postman/i.test(ua)) {
    deviceType = 'Other';
  }

  let browser = 'Unknown';
  if (/edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/opera|opr\//i.test(ua)) {
    browser = 'Opera';
  } else if (/postmanruntime/i.test(ua)) {
    browser = 'Postman';
  }

  let os = 'Unknown';
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return { deviceType, browser, os };
};

module.exports = { parseUserAgent };
