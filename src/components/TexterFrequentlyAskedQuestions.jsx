// Spoke: A mass-contact text/SMS peer-to-peer messaging tool
// Copyright (c) 2016-2021 MoveOn Civic Action
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 3 as
// published by the Free Software Foundation,
// with the Additional Term under Section 7(b) to include preserving
// the following author attribution statement in the Spoke application:
//
//    Spoke is developed and maintained by people committed to fighting
//    oppressive systems and structures, including economic injustice,
//    racism, patriarchy, and militarism
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program (see ./LICENSE). If not, see <https://www.gnu.org/licenses/>.

import React from "react";
import PropTypes from "prop-types";
import { Card, CardTitle, CardText } from "material-ui/Card";

const TexterFaqs = ({ faqs }) => {
  return (
    <div>
      <h1>Frequently Asked Questions</h1>
      {faqs.map((faq, idx) => (
        <Card key={idx}>
          <CardTitle title={`${idx + 1}. ${faq.question}`} />
          <CardText>
            <p>{faq.answer}</p>
          </CardText>
        </Card>
      ))}
      <Card>
        <CardTitle title={`${faqs.length}. Who built Spoke?`} />
        <CardText>
          <p>
            Spoke is developed and maintained by people committed to fighting
            oppressive systems and structures, including economic injustice,
            racism, patriarchy, and militarism.
          </p>
        </CardText>
      </Card>
    </div>
  );
};

TexterFaqs.propTypes = {
  faqs: PropTypes.array
};

export default TexterFaqs;
