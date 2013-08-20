"""
Module that allows to insert LTI tools to page.
"""

import logging
import requests

from xmodule.editing_module import MetadataOnlyEditingDescriptor
from xmodule.x_module import XModule
from pkg_resources import resource_string
from xblock.core import String, Scope

log = logging.getLogger(__name__)


class LTIFields(object):
    """provider_url and tool_id together is unique location of LTI in the web."""
    client_key = String(help="Client key", default='', scope=Scope.settings)
    client_secret = String(help="Client secret", default='', scope=Scope.settings)
    provider_url = String(
        help="URL of the tool provider",
        default='',
        # TODO: Write a letter.
        scope=Scope.settings
    )
    tool_id = String(
        help="The ID of the tool",
        default="",
        # TODO: Write a letter.
        scope=Scope.settings
    )


class LTIModule(LTIFields, XModule):
    '''LTI Module'''

    js = {
        'js': [
            resource_string(__name__, 'js/src/lti/lti.js')
        ]
    }
    css = {'scss': [resource_string(__name__, 'css/gst/display.scss')]}
    js_module_name = "LTI"

    def get_html(self):
        """ Renders parameters to template. """

        params = {
            'lti_html': self.get_lti_html(),
            'element_id': self.location.html_id(),
            'element_class': self.location.category,
        }
        content = self.system.render_template(
            'lti.html', params
        )
        return content

    def get_lti_html(self):
        """Obtains LTI html from provider"""
        current_user = u'EdX Student'
        test_url = u'https://bc-staging.vitalsource.com/books/L-999-70103'
        key = '5c6b9020-066a-11e3-8ffd-0800200c9a66'
        secret = '75413f322a7b4e76223e332c625f3d34'
        authorization = requests.auth.OAuth1(
            client_key=unicode(key),
            client_secret=unicode(secret)
        )
        request = requests.post(
            url=test_url,
            auth=authorization,
            data={u'user_id': current_user})
        return request.content


class LTIModuleDescriptor(LTIFields, MetadataOnlyEditingDescriptor):
    module_class = LTIModule


