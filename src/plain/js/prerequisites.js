/*
    This software package has a mixed license model. If not otherwise stated
    then the license applies as follows.
  
    The [info.html background information section] contains descriptions
    and hints on material used from other sources and creators and/or authors of related
    items. Due to the fact that the related material and underlying principles are already
    aged and been published several centuries ago these are in the public domain.
  
    It occurs that in case of simple reproduction of material and usage of Creative
    Commons alike licensing a more detailed license description can be found looking into
    the given references mentioned.
  
    Trademarks mentioned belong to their holders respectively and clearly and I solely
    mention these in purpose of citation and referencing.
  
    Created by Oliver Merkel on June 25th, 2013.
  
    Copyright (c) 2013
    @author Oliver Merkel, Merkel(dot)Oliver(at)web(dot)de.
    All rights reserved.
  
    @version 1.0
    @since   2013-06-25
  
    @section LICENSE
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions
    are met:
  
    Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  
    Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  
    Neither the name of the project's author nor the names of its
    contributors may be used to endorse or promote products derived from
    this software without specific prior written permission.
  
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
    _AS IS_ AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
    LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
    FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
    TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

this.dummyCanvas=document.createElement('canvas');
if (!!this.dummyCanvas.getContext) {
  document.write("<iframe src=\"menu.html\" name=\"iframe\" id=\"iframe\" />");
  var iframe = document.getElementById('iframe');
}
else {
  document.write("Your browser does not support HTML5 canvas.");
}
