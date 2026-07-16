(function () {
  'use strict';

  var button = document.getElementById('loadKitForm');
  var mount = document.getElementById('kitFormMount');
  if (!button || !mount) return;

  var isEnabled = button.getAttribute('data-kit-enabled') === 'true';
  var formSource = button.getAttribute('data-kit-src');
  var formUid = button.getAttribute('data-kit-uid');

  if (!isEnabled || !formSource || !formUid) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.textContent = '이메일 신청 점검 중';
    mount.textContent = '보관·삭제 기준 확인을 마친 뒤 신청을 다시 열겠습니다.';
    return;
  }

  button.addEventListener('click', function () {
    if (button.disabled) return;

    button.disabled = true;
    button.textContent = '신청 폼 불러오는 중…';
    mount.textContent = '외부 신청 폼을 불러오고 있습니다.';

    var script = document.createElement('script');
    script.async = true;
    script.src = formSource;
    script.setAttribute('data-uid', formUid);
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.onload = function () {
      mount.textContent = '';
      button.hidden = true;
    };
    script.onerror = function () {
      mount.textContent = '신청 폼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      button.textContent = '신청 폼 다시 불러오기';
    };

    mount.parentNode.insertBefore(script, mount.nextSibling);
  });
}());