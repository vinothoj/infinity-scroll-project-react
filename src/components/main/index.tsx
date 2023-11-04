import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Spinner from "react-bootstrap/Spinner";
import { useMachine } from "@xstate/react";
import { createMachine, assign } from "xstate";
import lodash from "lodash";
import { Http } from "services";

interface ApiMachineContext {
  response: any | null;
  error: any | null;
}
type ApiMachineEvent = { type: "FETCH" };
const apiMachine = createMachine<ApiMachineContext, ApiMachineEvent>({
  id: "api",
  initial: "idle",
  states: {
    idle: {
      on: {
        FETCH: "loading",
      },
    },
    loading: {
      invoke: {
        src: "fetchData",
        onDone: {
          target: "success",
          actions: "setResponse",
        },
        onError: "error",
      },
    },
    success: {
      on: {
        FETCH: "loading",
      },
    },
    error: {
      on: {
        FETCH: "loading",
      },
    },
  },
});

// Define the actions for the machine
const apiMachineActions = {
  setResponse: assign((context: ApiMachineContext, event: any) => {
    return { response: event.data };
  }),
};

let listMoreItems: any = [];

export const Main: React.FC = () => {
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [rowItems, setRowItems] = useState([] as any);
  const [rowMoreItems, setRowMoreItems] = useState([] as any);
  const [isLoading, setLoading] = useState(false);
  const [isScrollBottom, setIsScrollBottom] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState();
  const [state, send] = useMachine(apiMachine, {
    services: {
      fetchData: (context) => getGalleryFeeds(page, "initial-load"),
    },
    context: {
      response: null,
      error: null,
    },
    actions: apiMachineActions,
  });

  useEffect(() => {
    send("FETCH");
  }, []);

  useEffect(() => {
    const pagination: any = page + 1;
    if (isScrollBottom) {
      if (page !== lastPage && !isMoreLoading) {
        getGalleryFeeds(pagination, "scroll-pagination-load");
      }
    }
  }, [page, lastPage, isScrollBottom]);

  const trackScrolling = (el: any) => {
    const bottom =
      Math.ceil(window.innerHeight + window.scrollY) >=
      document.documentElement.scrollHeight; //scroll bottom
    const element: any = document.getElementById("middle-scroll");
    if (bottom) {
      if (element) {
        setIsScrollBottom(true);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", trackScrolling);
    return () => {
      window.removeEventListener("scroll", trackScrolling);
    };
  }, []);

  const emptyResults = (
    <div className="loading-center">
      <p>No gallery feed found</p>
    </div>
  );

  const pageLoading = (
    <div className="loading-center">
      <Spinner animation="border" role="status">
        <span className="sr-only">Loading...</span>
      </Spinner>
    </div>
  );

  const getGalleryFeeds = (page: any, loadType: string) => {
    loadType === "scroll-pagination-load"
      ? setIsMoreLoading(true)
      : setLoading(true);
    setPage(page);
    return Http.get(`/photo-gallery-feeds/${page}`)
      .then((response: any) => {
        const rowData = response.nodes;
        if (!lodash.isEmpty(rowData)) {
          if (loadType === "scroll-pagination-load") {
            listMoreItems.push(...rowMoreItems.concat(...rowData));
            setRowMoreItems(listMoreItems);
            setIsMoreLoading(false);
            setIsScrollBottom(false);
            const cardFirstData = [...rowData].shift();
            if (cardFirstData) {
              const scrollId = `photo-scroll-${cardFirstData?.id}`;
              const element: any = document.getElementById(scrollId);
              element?.scrollIntoView({ behavior: "smooth" });
            }
          } else {
            setRowItems(rowData);
            setLoading(false);
          }
        } else {
          setLastPage(page);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch data from your server:", error);
        setLoading(false);
        setRowItems([]);
      });
  };

  const galleryFeeds = (item: any) => {
    const row = item?.node;
    const { nid: id } = item?.node;
    return (
      <div id={`photo-scroll-${id}`} className="gallery-section">
        <Row>
          <Col md={2}>
            <Image
              width={120}
              height={120}
              className="mr-3"
              src={lodash.get(row, "field_photo_image_section")}
              alt="Generic placeholder"
              rounded
            />
          </Col>
          <Col md={10}>
            <Card.Body>
              <Card.Text>
                <h5>{lodash.get(row, "title")}</h5>
                <p>{lodash.get(row, "last_update")}</p>
              </Card.Text>
            </Card.Body>
          </Col>
        </Row>
      </div>
    );
  };

  const renderMoreItems = (data: any) => {
    if (data === "more-item") {
      return rowMoreItems?.map((item: any) => galleryFeeds(item));
    }
  };

  return (
    <div className="main-section">
      <Container>
        <Row>
          <Col md={{ span: 10, offset: 1 }}>
            <Row>
              {!isLoading ? (
                state.value === "success" && !lodash.isEmpty(rowItems) ? (
                  <Row>
                    <Card>
                      {rowItems.map((item: any) => galleryFeeds(item))}
                      {renderMoreItems("more-item")}
                      <div id="middle-scroll" />
                      {!isMoreLoading ? <></> : pageLoading}
                    </Card>
                  </Row>
                ) : (
                  emptyResults
                )
              ) : (
                <Col md={{ span: 10, offset: 1 }}>{pageLoading}</Col>
              )}
              {state.value === "error" && (
                <p>
                  Error: {lodash.get(state, "context.error.message", "Error")}
                </p>
              )}
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
